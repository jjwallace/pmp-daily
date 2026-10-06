<script lang="ts">
  import type { Session } from '$lib/types';
  import { BY_ID, CASE_BY_ID } from '$lib/questions';
  import { domainColor, domainName, taskName } from '$lib/blueprint';
  import { sessionScore } from '$lib/analytics';
  import { correctAnswerText } from '$lib/grade';
  import QuestionView from '$lib/components/QuestionView.svelte';

  let { session, onback }: { session: Session; onback: () => void } = $props();

  let onlyWrong = $state(false);
  const items = $derived(
    session.attempts
      .map((a, i) => ({ a, i, q: BY_ID.get(a.qid) }))
      .filter((x) => x.q && (!onlyWrong || !x.a.correct)),
  );
</script>

<div class="review">
  <header>
    <button class="back" onclick={onback} aria-label="Back">‹</button>
    <div>
      <h1>Review</h1>
      <small>{session.date} · {Math.round(sessionScore(session) * 100)}%</small>
    </div>
    <label class="toggle"><input type="checkbox" bind:checked={onlyWrong} /> Misses only</label>
  </header>
  <div class="scroll">
    {#each items as { a, i, q } (a.qid + i)}
      {@const cs = q!.caseId ? CASE_BY_ID.get(q!.caseId) : undefined}
      <article class="card" class:ok={a.correct} class:bad={!a.correct}>
        <div class="meta">
          <span class="num">{i + 1}</span>
          <span class="chip" style="color:{domainColor(q!.domain)};border-color:{domainColor(q!.domain)}">{domainName(q!.domain)}</span>
          <span class="res">{a.correct ? '✓ Correct' : '✗ Missed'}</span>
        </div>
        <p class="task">Task {q!.task}: {taskName(q!.domain, q!.task)}</p>
        {#if cs}<p class="scenario"><strong>{cs.title}:</strong> {cs.scenario}</p>{/if}
        <QuestionView question={q!} revealed initial={a.response} seed={i + 7} />
        {#if !a.correct}<p class="ans"><strong>Correct answer:</strong><br />{correctAnswerText(q!)}</p>{/if}
        <p class="why">{q!.explanation}</p>
      </article>
    {/each}
  </div>
</div>

<style>
  .review { position: fixed; inset: 0; display: flex; flex-direction: column; max-width: 640px; margin: 0 auto; background: var(--bg); }
  header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: calc(12px + var(--safe-top)) 16px 10px;
    border-bottom: 2px solid var(--line);
  }
  .back { background: none; border: none; font-size: 2.2rem; line-height: 1; color: var(--muted); cursor: pointer; padding: 0 6px; }
  h1 { margin: 0; font-size: 1.2rem; font-weight: 900; }
  header small { color: var(--muted); font-weight: 700; }
  .toggle { margin-left: auto; font-size: 0.8rem; font-weight: 800; display: flex; gap: 6px; align-items: center; color: var(--muted); }
  .scroll { flex: 1; overflow-y: auto; padding: 14px 16px calc(24px + var(--safe-bottom)); display: flex; flex-direction: column; gap: 14px; }
  article { display: flex; flex-direction: column; gap: 10px; border-left-width: 6px; }
  article.ok { border-left-color: var(--green); }
  article.bad { border-left-color: var(--red); }
  .meta { display: flex; align-items: center; gap: 8px; }
  .num { font-weight: 900; color: var(--muted); }
  .res { margin-left: auto; font-weight: 900; font-size: 0.8rem; }
  .ok .res { color: var(--green); }
  .bad .res { color: var(--red); }
  .task { margin: -4px 0 0; font-size: 0.75rem; color: var(--muted); font-weight: 700; }
  .scenario { margin: 0; font-size: 0.85rem; line-height: 1.45; background: color-mix(in srgb, var(--purple) 10%, var(--card)); border-radius: 12px; padding: 10px; }
  .ans { margin: 0; font-size: 0.88rem; line-height: 1.45; font-weight: 700; color: var(--green-dark); white-space: pre-line; }
  .why { margin: 0; font-size: 0.88rem; line-height: 1.45; font-weight: 600; background: var(--bg-soft); border-radius: 12px; padding: 10px 12px; }
</style>
