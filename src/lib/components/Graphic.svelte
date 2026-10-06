<script lang="ts">
  import type { Graphic } from '$lib/types';

  let {
    graphic,
    selectable = false,
    selected = null,
    correctZone = null,
    revealed = false,
    onselect,
  }: {
    graphic: Graphic;
    selectable?: boolean;
    selected?: string | null;
    correctZone?: string | null;
    revealed?: boolean;
    onselect?: (zone: string) => void;
  } = $props();

  const W = 340;
  const H = 210;
  const pad = { l: 34, r: 12, t: 14, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  function zoneClass(id: string) {
    if (revealed) {
      if (id === correctZone) return 'zone correct';
      if (id === selected) return 'zone wrong';
      return 'zone';
    }
    return id === selected ? 'zone selected' : 'zone';
  }
  function pick(id: string) {
    if (selectable && !revealed) onselect?.(id);
  }
  function key(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(id);
    }
  }
  const niceMax = (v: number) => {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / p) * p;
  };
</script>

<figure class="graphic" class:selectable>
  {#if graphic.title}<figcaption>{graphic.title}</figcaption>{/if}

  {#if graphic.kind === 'table'}
    <div class="table-wrap">
      <table>
        <thead><tr>{#each graphic.headers as h}<th>{h}</th>{/each}</tr></thead>
        <tbody>
          {#each graphic.rows as row, i}
            <tr
              class={selectable || revealed ? zoneClass(`r${i}`) : ''}
              onclick={() => pick(`r${i}`)}
              tabindex={selectable ? 0 : -1}
              onkeydown={(e) => key(e, `r${i}`)}
            >
              {#each row as cell}<td>{cell}</td>{/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else if graphic.kind === 'burndown'}
    {@const g = graphic}
    {@const ymax = niceMax(g.total)}
    {@const x = (d: number) => pad.l + (d / g.days) * iw}
    {@const y = (v: number) => pad.t + ih - (v / ymax) * ih}
    {@const pts = g.actual.map((v, d) => (v == null ? null : { d, v })).filter((p) => p != null)}
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={g.title ?? 'Burndown chart'}>
      {#each [0, 0.5, 1] as f}
        <line class="grid" x1={pad.l} x2={W - pad.r} y1={y(ymax * f)} y2={y(ymax * f)} />
        <text class="tick" x={pad.l - 6} y={y(ymax * f) + 4} text-anchor="end">{Math.round(ymax * f)}</text>
      {/each}
      {#each Array(g.days + 1) as _, d}
        <text class="tick" x={x(d)} y={H - 8} text-anchor="middle">{d}</text>
      {/each}
      <line class="ideal" x1={x(0)} y1={y(g.total)} x2={x(g.days)} y2={y(0)} />
      <polyline class="series s-blue" points={pts.map((p) => `${x(p!.d)},${y(p!.v)}`).join(' ')} />
      {#each pts as p}
        {@const id = `d${p!.d}`}
        <g
          class={zoneClass(id)}
          role={selectable ? 'button' : undefined}
          tabindex={selectable ? 0 : -1}
          aria-label="Point {p!.d}: {p!.v}"
          onclick={() => pick(id)}
          onkeydown={(e) => key(e, id)}
        >
          <circle class="hit" cx={x(p!.d)} cy={y(p!.v)} r="14" />
          <circle class="dot" cx={x(p!.d)} cy={y(p!.v)} r="5" />
        </g>
      {/each}
    </svg>
    <div class="legend"><span><i class="sw dashed"></i>Ideal</span><span><i class="sw blue"></i>Remaining</span></div>
  {:else if graphic.kind === 'scurve'}
    {@const g = graphic}
    {@const n = Math.max(g.pv.length, g.ev.length, g.ac.length)}
    {@const ymax = niceMax(Math.max(...g.pv, ...g.ev, ...g.ac))}
    {@const x = (p: number) => pad.l + ((p - 0.5) / n) * iw}
    {@const y = (v: number) => pad.t + ih - (v / ymax) * ih}
    {@const line = (arr: number[]) => arr.map((v, i) => `${x(i + 1)},${y(v)}`).join(' ')}
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={g.title ?? 'S-curve'}>
      {#each [0, 0.5, 1] as f}
        <line class="grid" x1={pad.l} x2={W - pad.r} y1={y(ymax * f)} y2={y(ymax * f)} />
        <text class="tick" x={pad.l - 6} y={y(ymax * f) + 4} text-anchor="end">{Math.round(ymax * f)}</text>
      {/each}
      {#each Array(n) as _, i}
        {@const id = `p${i + 1}`}
        {#if i < g.ev.length}
          <rect
            class="{zoneClass(id)} band"
            x={x(i + 1) - iw / n / 2}
            y={pad.t}
            width={iw / n}
            height={ih}
            role={selectable ? 'button' : undefined}
            tabindex={selectable ? 0 : -1}
            aria-label="Period {i + 1}"
            onclick={() => pick(id)}
            onkeydown={(e) => key(e, id)}
          />
        {/if}
        <text class="tick" x={x(i + 1)} y={H - 8} text-anchor="middle">{i + 1}</text>
      {/each}
      <polyline class="series s-gray dashed-line" points={line(g.pv)} />
      <polyline class="series s-green" points={line(g.ev)} />
      <polyline class="series s-red" points={line(g.ac)} />
      {#each g.ev as v, i}<circle class="pt green" cx={x(i + 1)} cy={y(v)} r="3" />{/each}
      {#each g.ac as v, i}<circle class="pt red" cx={x(i + 1)} cy={y(v)} r="3" />{/each}
    </svg>
    <div class="legend">
      <span><i class="sw dashed"></i>PV</span><span><i class="sw green"></i>EV</span><span><i class="sw red"></i>AC</span>
    </div>
    <div class="values">
      {#each Array(Math.max(g.ev.length, g.ac.length)) as _, i}
        <span>P{i + 1}: PV {g.pv[i]} · EV {g.ev[i] ?? '–'} · AC {g.ac[i] ?? '–'}</span>
      {/each}
    </div>
  {:else if graphic.kind === 'kanban'}
    {@const g = graphic}
    <div class="kanban" style="--cols:{g.columns.length}">
      {#each g.columns as col}
        <button
          type="button"
          class="{zoneClass(col.id)} kcol"
          disabled={!selectable && !revealed}
          onclick={() => pick(col.id)}
        >
          <div class="khead">
            <strong>{col.name}</strong>
            <small>{col.cards}{col.wip ? ` / WIP ${col.wip}` : ''}</small>
          </div>
          <div class="kcards">
            {#each Array(Math.min(col.cards, 12)) as _}<span class="kcard"></span>{/each}
          </div>
        </button>
      {/each}
    </div>
  {:else if graphic.kind === 'riskMatrix'}
    {@const g = graphic}
    {@const cell = Math.min(iw, ih) / 5}
    {@const ox = pad.l + (iw - cell * 5) / 2 + 10}
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={g.title ?? 'Risk matrix'}>
      {#each [1, 2, 3, 4, 5] as p}
        {#each [1, 2, 3, 4, 5] as i}
          {@const s = p * i}
          <rect
            class="heat {s >= 15 ? 'h3' : s >= 8 ? 'h2' : 'h1'}"
            x={ox + (i - 1) * cell}
            y={pad.t + (5 - p) * cell}
            width={cell - 2}
            height={cell - 2}
            rx="4"
          />
        {/each}
      {/each}
      <text class="axis" x={ox + cell * 2.5} y={H - 4} text-anchor="middle">Impact →</text>
      <text class="axis" x={ox - 14} y={pad.t + cell * 2.5} text-anchor="middle" transform="rotate(-90 {ox - 14} {pad.t + cell * 2.5})">Probability →</text>
      {#each g.risks as r}
        {@const cx = ox + (r.i - 0.5) * cell}
        {@const cy = pad.t + (5 - r.p + 0.5) * cell}
        <g
          class={zoneClass(r.id)}
          role={selectable ? 'button' : undefined}
          tabindex={selectable ? 0 : -1}
          aria-label={r.label}
          onclick={() => pick(r.id)}
          onkeydown={(e) => key(e, r.id)}
        >
          <circle class="hit" {cx} {cy} r="16" />
          <circle class="dot big" {cx} {cy} r="8" />
          <text class="rlabel" x={cx > W - 90 ? cx - 12 : cx + 12} {cy} dy="4" text-anchor={cx > W - 90 ? 'end' : 'start'}>{r.label}</text>
        </g>
      {/each}
    </svg>
  {:else if graphic.kind === 'bars'}
    {@const g = graphic}
    {@const ymax = niceMax(Math.max(...g.values, g.line ?? 0))}
    {@const bw = iw / g.values.length}
    {@const y = (v: number) => pad.t + ih - (v / ymax) * ih}
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={g.title ?? 'Bar chart'}>
      {#each [0, 0.5, 1] as f}
        <line class="grid" x1={pad.l} x2={W - pad.r} y1={y(ymax * f)} y2={y(ymax * f)} />
        <text class="tick" x={pad.l - 6} y={y(ymax * f) + 4} text-anchor="end">{Math.round(ymax * f)}</text>
      {/each}
      {#each g.values as v, i}
        {@const id = `b${i}`}
        <g
          class={zoneClass(id)}
          role={selectable ? 'button' : undefined}
          tabindex={selectable ? 0 : -1}
          aria-label="{g.labels[i]}: {v}"
          onclick={() => pick(id)}
          onkeydown={(e) => key(e, id)}
        >
          <rect class="hitbar" x={pad.l + i * bw} y={pad.t} width={bw} height={ih} />
          <rect class="bar" x={pad.l + i * bw + bw * 0.18} y={y(v)} width={bw * 0.64} height={pad.t + ih - y(v)} rx="5" />
          <text class="tick strong" x={pad.l + i * bw + bw / 2} y={y(v) - 5} text-anchor="middle">{v}</text>
        </g>
        <text class="tick" x={pad.l + i * bw + bw / 2} y={H - 8} text-anchor="middle">{g.labels[i]}</text>
      {/each}
      {#if g.line}
        <line class="ideal" x1={pad.l} x2={W - pad.r} y1={y(g.line)} y2={y(g.line)} />
        <text class="tick" x={W - pad.r} y={y(g.line) - 4} text-anchor="end">{g.lineLabel ?? ''} {g.line}</text>
      {/if}
    </svg>
  {:else if graphic.kind === 'powerInterest'}
    {@const g = graphic}
    {@const quads = [
      { id: 'satisfy', label: 'Keep satisfied', qx: 0, qy: 0 },
      { id: 'manage', label: 'Manage closely', qx: 1, qy: 0 },
      { id: 'monitor', label: 'Monitor', qx: 0, qy: 1 },
      { id: 'inform', label: 'Keep informed', qx: 1, qy: 1 },
    ]}
    {@const qw = iw / 2}
    {@const qh = ih / 2}
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={g.title ?? 'Power interest grid'}>
      {#each quads as q}
        <g
          class={zoneClass(q.id)}
          role={selectable ? 'button' : undefined}
          tabindex={selectable ? 0 : -1}
          aria-label="Quadrant"
          onclick={() => pick(q.id)}
          onkeydown={(e) => key(e, q.id)}
        >
          <rect class="quad" x={pad.l + q.qx * qw + 2} y={pad.t + q.qy * qh + 2} width={qw - 4} height={qh - 4} rx="8" />
          {#if revealed}
            <text class="qlabel" x={pad.l + q.qx * qw + qw / 2} y={pad.t + q.qy * qh + 18} text-anchor="middle">{q.label}</text>
          {/if}
        </g>
      {/each}
      {#each g.items as it}
        <circle class="pt purple" cx={pad.l + it.interest * iw} cy={pad.t + (1 - it.power) * ih} r="5" />
        <text class="rlabel" x={pad.l + it.interest * iw} y={pad.t + (1 - it.power) * ih + 16} text-anchor="middle">{it.label}</text>
      {/each}
      <text class="axis" x={pad.l + iw / 2} y={H - 6} text-anchor="middle">Interest →</text>
      <text class="axis" x={12} y={pad.t + ih / 2} text-anchor="middle" transform="rotate(-90 12 {pad.t + ih / 2})">Power →</text>
    </svg>
  {/if}
</figure>

<style>
  .graphic {
    margin: 0;
    background: var(--card);
    border: 2px solid var(--line);
    border-radius: 16px;
    padding: 10px 10px 8px;
  }
  figcaption {
    font-size: 0.78rem;
    font-weight: 800;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 2px 4px 6px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }
  .grid {
    stroke: var(--line);
    stroke-width: 1;
  }
  .tick {
    fill: var(--muted);
    font-size: 10px;
    font-weight: 700;
  }
  .tick.strong {
    fill: var(--text);
  }
  .axis {
    fill: var(--muted);
    font-size: 10px;
    font-weight: 800;
  }
  .ideal {
    stroke: var(--muted);
    stroke-dasharray: 5 4;
    stroke-width: 1.5;
    opacity: 0.7;
  }
  .series {
    fill: none;
    stroke-width: 3;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .s-blue { stroke: var(--blue); }
  .s-green { stroke: var(--green); }
  .s-red { stroke: var(--red); }
  .s-gray { stroke: var(--muted); }
  .dashed-line { stroke-dasharray: 6 5; stroke-width: 2; }
  .pt.green { fill: var(--green); }
  .pt.red { fill: var(--red); }
  .pt.purple { fill: var(--purple); }

  .hit, .hitbar { fill: transparent; }
  .dot { fill: var(--blue); stroke: var(--card); stroke-width: 2; transition: r 0.15s; }
  .dot.big { fill: var(--text); }
  .bar { fill: var(--blue); opacity: 0.85; }
  .band { fill: transparent; }
  .quad { fill: var(--bg-soft); stroke: var(--line); stroke-width: 2; }
  .qlabel { fill: var(--text); font-size: 11px; font-weight: 800; }
  .rlabel { fill: var(--text); font-size: 10px; font-weight: 800; paint-order: stroke; stroke: var(--card); stroke-width: 3px; }
  .heat.h1 { fill: color-mix(in srgb, var(--green) 28%, var(--card)); }
  .heat.h2 { fill: color-mix(in srgb, var(--yellow) 38%, var(--card)); }
  .heat.h3 { fill: color-mix(in srgb, var(--red) 34%, var(--card)); }

  .selectable .zone { cursor: pointer; }
  .selectable .zone:hover .dot { r: 7; }
  .selectable .zone:hover .quad, .selectable .zone.band:hover { fill: color-mix(in srgb, var(--blue) 12%, transparent); }
  .selectable .zone:hover .bar { opacity: 1; }
  .zone:focus-visible { outline: 3px solid var(--blue); outline-offset: 2px; }

  .zone.selected .dot { fill: var(--blue); r: 8; }
  .zone.selected .bar { fill: var(--blue-dark); opacity: 1; }
  .zone.selected .quad, .zone.selected.band { fill: color-mix(in srgb, var(--blue) 22%, transparent); stroke: var(--blue); }
  .zone.correct .dot { fill: var(--green); r: 8; }
  .zone.correct .bar { fill: var(--green); opacity: 1; }
  .zone.correct .quad, .zone.correct.band { fill: color-mix(in srgb, var(--green) 26%, transparent); stroke: var(--green); }
  .zone.wrong .dot { fill: var(--red); r: 8; }
  .zone.wrong .bar { fill: var(--red); opacity: 1; }
  .zone.wrong .quad, .zone.wrong.band { fill: color-mix(in srgb, var(--red) 22%, transparent); stroke: var(--red); }

  .legend {
    display: flex;
    gap: 14px;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--muted);
    margin-top: 4px;
  }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .sw { display: inline-block; width: 16px; height: 4px; border-radius: 2px; }
  .sw.blue { background: var(--blue); }
  .sw.green { background: var(--green); }
  .sw.red { background: var(--red); }
  .sw.dashed { background: repeating-linear-gradient(90deg, var(--muted) 0 4px, transparent 4px 7px); }
  .values {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    justify-content: center;
    font-size: 0.7rem;
    color: var(--muted);
    font-weight: 700;
    margin-top: 6px;
  }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th, td { padding: 7px 8px; text-align: left; border-bottom: 2px solid var(--line); }
  th { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; }
  td { font-weight: 700; }
  tr.zone { cursor: pointer; }
  tr.zone.selected { background: color-mix(in srgb, var(--blue) 18%, transparent); }
  tr.zone.correct { background: color-mix(in srgb, var(--green) 22%, transparent); }
  tr.zone.wrong { background: color-mix(in srgb, var(--red) 18%, transparent); }

  .kanban {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 6px;
  }
  .kcol {
    all: unset;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 2px solid var(--line);
    border-radius: 12px;
    padding: 6px;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: transform 0.12s, border-color 0.12s, background 0.12s;
  }
  .selectable .kcol { cursor: pointer; }
  .selectable .kcol:active { transform: scale(0.97); }
  .kcol:focus-visible { outline: 3px solid var(--blue); }
  .kcol.selected { border-color: var(--blue); background: color-mix(in srgb, var(--blue) 14%, var(--bg-soft)); }
  .kcol.correct { border-color: var(--green); background: color-mix(in srgb, var(--green) 18%, var(--bg-soft)); }
  .kcol.wrong { border-color: var(--red); background: color-mix(in srgb, var(--red) 14%, var(--bg-soft)); }
  .khead { display: flex; flex-direction: column; gap: 1px; }
  .khead strong { font-size: 0.72rem; line-height: 1.1; }
  .khead small { font-size: 0.68rem; color: var(--muted); font-weight: 800; }
  .kcards { display: flex; flex-direction: column; gap: 3px; }
  .kcard { height: 8px; border-radius: 3px; background: var(--card); border: 1.5px solid var(--line); }
</style>
