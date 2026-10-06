<script lang="ts">
  import { app, persist, exportData, importData, resetAll } from '$lib/store.svelte';
  import { QUESTIONS, CASES } from '$lib/questions';

  let backup = $state('');
  let importText = $state('');
  let msg = $state('');
  let confirmReset = $state(false);

  function save() {
    persist();
  }
  async function doExport() {
    backup = exportData();
    try {
      await navigator.clipboard.writeText(backup);
      msg = 'Backup copied to clipboard.';
    } catch {
      msg = 'Copy the backup text below.';
    }
  }
  function doImport() {
    try {
      importData(importText);
      msg = 'Backup restored.';
      importText = '';
    } catch (e) {
      msg = (e as Error).message || 'Invalid backup';
    }
  }
</script>

<div class="settings">
  <h1>Settings</h1>

  <div class="card group">
    <label class="row">
      <span>Sound effects</span>
      <input type="checkbox" class="switch" bind:checked={app.settings.sound} onchange={save} />
    </label>
    <label class="row">
      <span>Haptics</span>
      <input type="checkbox" class="switch" bind:checked={app.settings.haptics} onchange={save} />
    </label>
    <label class="row">
      <span>Exam date</span>
      <input type="date" class="date" bind:value={app.settings.examDate} onchange={save} />
    </label>
  </div>

  <h2 class="section-title">Backup</h2>
  <div class="card group">
    <p class="hint">Your results are stored on this device. Export a backup to move them or keep them safe.</p>
    <button class="btn blue small" onclick={doExport}>Export backup</button>
    {#if backup}<textarea readonly rows="4">{backup}</textarea>{/if}
    <textarea rows="3" placeholder="Paste a backup here to restore…" bind:value={importText}></textarea>
    <button class="btn ghost small" disabled={!importText.trim()} onclick={doImport}>Restore backup</button>
    {#if msg}<p class="msg">{msg}</p>{/if}
  </div>

  <h2 class="section-title">Danger zone</h2>
  <div class="card group">
    {#if confirmReset}
      <p class="hint">This deletes all quiz history and progress. It can't be undone.</p>
      <div class="two">
        <button class="btn ghost small" onclick={() => (confirmReset = false)}>Cancel</button>
        <button class="btn red small" onclick={() => { resetAll(); confirmReset = false; msg = 'All data reset.'; }}>Delete everything</button>
      </div>
    {:else}
      <button class="btn red small" onclick={() => (confirmReset = true)}>Reset all progress</button>
    {/if}
  </div>

  <h2 class="section-title">About</h2>
  <div class="card about">
    <p><strong>{QUESTIONS.length} original questions</strong> including {CASES.length} case studies, mapped to all 26 tasks of the PMP Examination Content Outline (July 2026): People 33%, Process 41%, Business Environment 26%, about 40% predictive and 60% agile/hybrid.</p>
    <p>Not affiliated with or endorsed by PMI. PMP and PMBOK are registered marks of the Project Management Institute, Inc.</p>
  </div>
</div>

<style>
  .settings { padding: calc(16px + var(--safe-top)) 16px 24px; }
  h1 { margin: 6px 4px 14px; font-size: 1.6rem; font-weight: 900; }
  .group { display: flex; flex-direction: column; gap: 12px; }
  .row { display: flex; align-items: center; justify-content: space-between; font-weight: 800; }
  .switch {
    appearance: none;
    width: 50px;
    height: 30px;
    border-radius: 999px;
    background: var(--line);
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
  }
  .switch::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .switch:checked { background: var(--green); }
  .switch:checked::after { transform: translateX(20px); }
  .date {
    font: inherit;
    font-weight: 800;
    padding: 6px 10px;
    border-radius: 10px;
    border: 2px solid var(--line);
    background: var(--bg-soft);
    color: var(--text);
  }
  .hint { margin: 0; color: var(--muted); font-weight: 700; font-size: 0.85rem; }
  textarea {
    width: 100%;
    font: 0.75rem ui-monospace, monospace;
    border: 2px solid var(--line);
    border-radius: 12px;
    padding: 8px;
    background: var(--bg-soft);
    color: var(--text);
    user-select: text;
  }
  .msg { margin: 0; font-weight: 800; color: var(--blue); font-size: 0.85rem; }
  .two { display: flex; gap: 10px; }
  .about p { margin: 0 0 8px; font-size: 0.85rem; line-height: 1.5; color: var(--muted); font-weight: 600; }
  .about strong { color: var(--text); }
</style>
