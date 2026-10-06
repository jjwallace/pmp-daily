<script lang="ts">
  import type { Question, Response } from '$lib/types';
  import Graphic from './Graphic.svelte';
  import { haptic, sound } from '$lib/fx';

  let {
    question: q,
    revealed = false,
    seed = 1,
    initial = null,
    onchange,
  }: {
    question: Question;
    revealed?: boolean;
    seed?: number;
    /** Pre-filled response, used when reviewing past answers */
    initial?: Response | null;
    onchange?: (r: Response | null) => void;
  } = $props();

  // Stable per-question shuffle
  function order(n: number, salt: number) {
    let s = (seed * 9301 + salt * 49297) % 233280;
    const idx = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }

  const optOrder = $derived(q.type === 'single' || q.type === 'multi' ? order(q.options.length, 1) : []);
  const leftOrder = $derived(q.type === 'match' ? order(q.left.length, 2) : []);
  const rightOrder = $derived(q.type === 'match' ? order(q.right.length, 3) : []);

  let single = $state<number | null>(initial?.type === 'single' ? initial.choice : null);
  let multi = $state<number[]>(initial?.type === 'multi' ? [...initial.choices] : []);
  let pairs = $state<(number | null)[]>(
    initial?.type === 'match' ? [...initial.pairs] : q.type === 'match' ? q.left.map(() => null) : [],
  );
  let activeLeft = $state<number | null>(null);
  let activeRight = $state<number | null>(null);
  let drops = $state<(number | null)[]>(
    initial?.type === 'dropdown' ? [...initial.choices] : q.type === 'dropdown' ? q.blanks.map(() => null) : [],
  );
  let zone = $state<string | null>(initial?.type === 'hotspot' ? initial.zone : null);

  const PAIR_COLORS = ['#1cb0f6', '#ce82ff', '#ff9600', '#ffc800', '#2b70c9', '#ff86d0'];

  function emit() {
    let r: Response | null = null;
    switch (q.type) {
      case 'single':
        r = single == null ? null : { type: 'single', choice: single };
        break;
      case 'multi':
        r = multi.length === q.answer.length ? { type: 'multi', choices: [...multi] } : null;
        break;
      case 'match':
        r = pairs.every((p) => p != null) ? { type: 'match', pairs: pairs as number[] } : null;
        break;
      case 'dropdown':
        r = drops.every((d) => d != null) ? { type: 'dropdown', choices: drops as number[] } : null;
        break;
      case 'hotspot':
        r = zone ? { type: 'hotspot', zone } : null;
        break;
    }
    onchange?.(r);
  }

  function tap() {
    haptic('tap');
    sound('tap');
  }

  function chooseSingle(i: number) {
    if (revealed) return;
    single = i;
    tap();
    emit();
  }
  function toggleMulti(i: number) {
    if (revealed || q.type !== 'multi') return;
    if (multi.includes(i)) multi = multi.filter((x) => x !== i);
    else if (multi.length < q.answer.length) multi = [...multi, i];
    else multi = [...multi.slice(1), i];
    tap();
    emit();
  }
  // Either column can be tapped first; a pair forms when one side of each is selected.
  // Tapping an already-paired tile breaks the pair and selects it again.
  function link(l: number, r: number) {
    const owner = pairs.indexOf(r);
    if (owner >= 0) pairs[owner] = null;
    pairs[l] = r;
    activeLeft = null;
    activeRight = null;
  }
  function tapLeft(l: number) {
    if (revealed) return;
    if (activeRight != null) link(l, activeRight);
    else if (pairs[l] != null) {
      pairs[l] = null;
      activeLeft = l;
    } else activeLeft = activeLeft === l ? null : l;
    tap();
    emit();
  }
  function tapRight(r: number) {
    if (revealed) return;
    const owner = pairs.indexOf(r);
    if (activeLeft != null) link(activeLeft, r);
    else if (owner >= 0) {
      pairs[owner] = null;
      activeRight = r;
    } else activeRight = activeRight === r ? null : r;
    tap();
    emit();
  }
  function setDrop(i: number, v: string) {
    drops[i] = v === '' ? null : Number(v);
    tap();
    emit();
  }
  function setZone(z: string) {
    zone = z;
    tap();
    emit();
  }

  const pairColor = (l: number) => PAIR_COLORS[l % PAIR_COLORS.length];
  const optState = (i: number, chosen: boolean, correct: boolean) =>
    revealed ? (correct ? 'correct' : chosen ? 'wrong' : 'dim') : chosen ? 'chosen' : '';

  const segments = $derived(q.type === 'dropdown' ? q.text.split(/(\{\d+\})/g) : []);
</script>

<div class="qv">
  {#if q.type === 'multi'}<p class="hint">Select {q.answer.length}</p>{/if}
  {#if q.type === 'match'}<p class="hint">Tap a term, then its match</p>{/if}
  {#if q.type === 'hotspot'}<p class="hint">Tap the chart</p>{/if}

  <h2 class="stem">{q.stem}</h2>

  {#if q.graphic && q.type !== 'hotspot'}
    <div class="anim-in"><Graphic graphic={q.graphic} /></div>
  {/if}

  {#if q.type === 'single'}
    <div class="opts">
      {#each optOrder as i, k}
        <button
          class="opt anim-in {optState(i, single === i, i === q.answer)}"
          onclick={() => chooseSingle(i)}
          disabled={revealed}
        >
          <span class="key">{k + 1}</span><span>{q.options[i]}</span>
        </button>
      {/each}
    </div>
  {:else if q.type === 'multi'}
    <div class="opts">
      {#each optOrder as i}
        <button
          class="opt anim-in {optState(i, multi.includes(i), q.answer.includes(i))}"
          onclick={() => toggleMulti(i)}
          disabled={revealed}
        >
          <span class="check" class:on={multi.includes(i)}>{multi.includes(i) ? '✓' : ''}</span><span>{q.options[i]}</span>
        </button>
      {/each}
    </div>
  {:else if q.type === 'match'}
    <div class="match">
      <div class="col">
        {#each leftOrder as l}
          {@const paired = pairs[l] != null}
          <button
            class="tile anim-in"
            class:active={activeLeft === l}
            class:paired
            class:correct={revealed && pairs[l] === l}
            class:wrong={revealed && pairs[l] !== l}
            style={paired && !revealed ? `--pc:${pairColor(l)}` : ''}
            onclick={() => tapLeft(l)}
            disabled={revealed}
          >{q.left[l]}</button>
        {/each}
      </div>
      <div class="col">
        {#each rightOrder as r}
          {@const owner = pairs.indexOf(r)}
          <button
            class="tile right anim-in"
            class:active={activeRight === r}
            class:paired={owner >= 0}
            class:correct={revealed && owner === r}
            class:wrong={revealed && owner >= 0 && owner !== r}
            style={owner >= 0 && !revealed ? `--pc:${pairColor(owner)}` : ''}
            onclick={() => tapRight(r)}
            disabled={revealed}
          >{q.right[r]}</button>
        {/each}
      </div>
    </div>
  {:else if q.type === 'dropdown'}
    <p class="fill anim-in">
      {#each segments as seg}
        {@const m = seg.match(/^\{(\d+)\}$/)}
        {#if m}
          {@const bi = Number(m[1])}
          {@const b = q.blanks[bi]}
          <select
            class="blank"
            class:filled={drops[bi] != null}
            class:correct={revealed && drops[bi] === b.answer}
            class:wrong={revealed && drops[bi] !== b.answer}
            disabled={revealed}
            value={drops[bi] == null ? '' : String(drops[bi])}
            onchange={(e) => setDrop(bi, (e.currentTarget as HTMLSelectElement).value)}
          >
            <option value="" disabled>choose…</option>
            {#each order(b.options.length, 10 + bi) as oi}<option value={String(oi)}>{b.options[oi]}</option>{/each}
          </select>
        {:else}
          {seg}
        {/if}
      {/each}
    </p>
  {:else if q.type === 'hotspot'}
    <div class="anim-in">
      <Graphic graphic={q.graphic} selectable={!revealed} selected={zone} correctZone={q.answer} {revealed} onselect={setZone} />
    </div>
  {/if}
</div>

<style>
  .qv { display: flex; flex-direction: column; gap: 14px; }
  .hint {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 800;
    color: var(--purple);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .stem {
    margin: 0;
    font-size: 1.12rem;
    line-height: 1.4;
    font-weight: 800;
  }
  .opts { display: flex; flex-direction: column; gap: 10px; }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 13px 14px;
    font: inherit;
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--text);
    background: var(--card);
    border: 2px solid var(--line);
    border-bottom-width: 4px;
    border-radius: 16px;
    cursor: pointer;
    transition: transform 0.08s, background 0.12s, border-color 0.12s;
    -webkit-tap-highlight-color: transparent;
  }
  .opt:active:not(:disabled) { transform: translateY(2px); border-bottom-width: 2px; margin-bottom: 2px; }
  .opt:disabled { cursor: default; }
  .opt.chosen { background: var(--blue-soft); border-color: var(--blue); color: var(--blue-dark); }
  .opt.correct { background: var(--green-soft); border-color: var(--green); color: var(--green-dark); }
  .opt.wrong { background: var(--red-soft); border-color: var(--red); color: var(--red-dark); }
  .opt.dim { opacity: 0.55; }
  .key, .check {
    flex: none;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border: 2px solid var(--line);
    border-radius: 9px;
    font-size: 0.8rem;
    font-weight: 900;
    color: var(--muted);
  }
  .check.on { background: var(--blue); border-color: var(--blue); color: #fff; }
  .opt.chosen .key { border-color: var(--blue); color: var(--blue); }

  .match { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .col { display: flex; flex-direction: column; gap: 8px; }
  .tile {
    font: inherit;
    font-size: 0.86rem;
    font-weight: 700;
    line-height: 1.25;
    color: var(--text);
    padding: 11px 10px;
    min-height: 58px;
    background: var(--card);
    border: 2px solid var(--line);
    border-bottom-width: 4px;
    border-radius: 14px;
    cursor: pointer;
    text-align: center;
    transition: transform 0.08s, border-color 0.12s, background 0.12s;
    -webkit-tap-highlight-color: transparent;
  }
  .tile.right { font-weight: 600; font-size: 0.8rem; }
  .tile.active { border-color: var(--blue); background: var(--blue-soft); transform: scale(1.02); }
  .tile.paired { border-color: var(--pc); background: color-mix(in srgb, var(--pc) 16%, var(--card)); }
  .tile.correct { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .tile.wrong { border-color: var(--red); background: var(--red-soft); color: var(--red-dark); }
  .tile:disabled { cursor: default; }

  .fill {
    margin: 0;
    font-size: 1.05rem;
    line-height: 2.4;
    font-weight: 700;
    background: var(--card);
    border: 2px solid var(--line);
    border-radius: 16px;
    padding: 10px 14px;
  }
  .blank {
    font: inherit;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--blue-dark);
    background: var(--blue-soft);
    border: 2px solid var(--blue);
    border-bottom-width: 4px;
    border-radius: 12px;
    padding: 3px 8px;
    margin: 0 2px;
    max-width: 100%;
  }
  .blank:not(.filled) { color: var(--muted); background: var(--bg-soft); border-color: var(--line); }
  .blank.correct { color: var(--green-dark); background: var(--green-soft); border-color: var(--green); opacity: 1; }
  .blank.wrong { color: var(--red-dark); background: var(--red-soft); border-color: var(--red); opacity: 1; }
</style>
