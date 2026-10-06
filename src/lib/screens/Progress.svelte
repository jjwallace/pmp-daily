<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { app } from '$lib/store.svelte';
  import { approachMastery, domainMastery, readiness, sessionScore, taskMastery, typeMastery, weakest } from '$lib/analytics';
  import { BANDS, DOMAINS, domainName, taskName } from '$lib/blueprint';
  import BandChip from '$lib/components/BandChip.svelte';

  let { ondrill }: { ondrill: (tasks: string[]) => void } = $props();

  const sessions = app.sessions;
  const ready = readiness(sessions);
  const dm = domainMastery(sessions);
  const tasks = taskMastery(sessions);
  const am = approachMastery(sessions);
  const tm = typeMastery(sessions);
  const weak = weakest(sessions, 5).filter((t) => t.attempts > 0);
  const totalQ = sessions.reduce((s, x) => s + x.attempts.length, 0);
  const totalC = sessions.reduce((s, x) => s + x.attempts.filter((a) => a.correct).length, 0);
  const trend = sessions.slice(-20).map(sessionScore);

  const TYPE_LABEL = { single: 'Multiple choice', multi: 'Multiple response', match: 'Matching', dropdown: 'Fill-in dropdown', hotspot: 'Hotspot / graphic' };
  let open = $state<string | null>('people');

  const SW = 300;
  const SH = 70;
  const spark = trend.map((v, i) => `${trend.length < 2 ? SW / 2 : (i / (trend.length - 1)) * SW},${SH - 6 - v * (SH - 12)}`).join(' ');

  let root: HTMLElement;
  onMount(() => {
    gsap.from(root.querySelectorAll('.pop'), { y: 20, opacity: 0, stagger: 0.06, duration: 0.45, ease: 'power2.out' });
    gsap.from(root.querySelectorAll('.bar-fill'), { width: 0, duration: 0.9, stagger: 0.03, ease: 'power3.out', delay: 0.2 });
  });
</script>

<div class="progress" bind:this={root}>
  <h1 class="pop">Your progress</h1>

  {#if !sessions.length}
    <div class="card empty pop">Finish your first daily quiz to see your strengths and weak spots.</div>
  {:else}
    <div class="summary pop">
      <div class="card s"><strong>{sessions.length}</strong><small>Quizzes</small></div>
      <div class="card s"><strong>{totalQ}</strong><small>Questions</small></div>
      <div class="card s"><strong>{totalQ ? Math.round((totalC / totalQ) * 100) : 0}%</strong><small>Accuracy</small></div>
    </div>

    <div class="card ready pop">
      <div>
        <small>Estimated readiness</small>
        <strong>{Math.round(ready.score * 100)}%</strong>
        <small>{Math.round(ready.coverage * 100)}% task coverage</small>
      </div>
      <BandChip band={ready.band} />
    </div>

    {#if trend.length > 1}
      <h2 class="section-title pop">Score trend</h2>
      <div class="card pop">
        <svg viewBox="0 0 {SW} {SH}" class="spark" preserveAspectRatio="none">
          <line x1="0" x2={SW} y1={SH - 6 - 0.68 * (SH - 12)} y2={SH - 6 - 0.68 * (SH - 12)} class="target" />
          <polyline points={spark} class="line" />
        </svg>
        <p class="caption">Last {trend.length} quizzes · dashed line = Target (68%)</p>
      </div>
    {/if}

    {#if weak.length}
      <h2 class="section-title pop">Address before exam day</h2>
      <div class="card weak pop">
        {#each weak as t, i}
          <div class="wrow">
            <span class="rank">{i + 1}</span>
            <div class="wtext">
              <strong>{taskName(t.domain, t.task)}</strong>
              <small>{domainName(t.domain)} · Task {t.task} · {t.correct}/{t.attempts} correct</small>
            </div>
            <BandChip band={t.band} />
          </div>
        {/each}
        <button class="btn orange" onclick={() => ondrill(weak.map((t) => t.key))}>Drill these 5</button>
      </div>
    {/if}

    <h2 class="section-title pop">Domains & tasks</h2>
    {#each DOMAINS as d}
      {@const m = dm[d.id]}
      <div class="card domain pop" style="--dc:{d.color}">
        <button class="dhead" onclick={() => (open = open === d.id ? null : d.id)}>
          <div>
            <strong>{d.name}</strong>
            <small>{Math.round(d.weight * 100)}% of exam · {m.attempts} answered</small>
          </div>
          <span class="pct">{m.attempts ? Math.round(m.score * 100) + '%' : '–'}</span>
        </button>
        <div class="bar"><div class="bar-fill" style="width:{m.attempts ? m.score * 100 : 0}%"></div></div>
        {#if open === d.id}
          <div class="tasks">
            {#each tasks.filter((t) => t.domain === d.id) as t}
              <div class="trow">
                <div class="ttext">
                  <span>{t.task}. {taskName(t.domain, t.task)}</span>
                  <div class="bar thin"><div class="bar-fill" style="width:{t.attempts ? t.score * 100 : 0}%;background:{BANDS[t.band].color}"></div></div>
                </div>
                <BandChip band={t.band} />
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    <h2 class="section-title pop">By approach</h2>
    <div class="card pop rows">
      {#each Object.entries(am) as [k, m]}
        <div class="row">
          <span class="rlabel">{k[0].toUpperCase() + k.slice(1)}</span>
          <div class="bar thin grow"><div class="bar-fill" style="width:{m.attempts ? m.score * 100 : 0}%;background:{BANDS[m.band].color}"></div></div>
          <span class="rpct">{m.attempts ? Math.round(m.score * 100) + '%' : '–'}</span>
        </div>
      {/each}
    </div>

    <h2 class="section-title pop">By question format</h2>
    <div class="card pop rows">
      {#each Object.entries(tm) as [k, m]}
        <div class="row">
          <span class="rlabel">{TYPE_LABEL[k as keyof typeof TYPE_LABEL]}</span>
          <div class="bar thin grow"><div class="bar-fill" style="width:{m.attempts ? m.score * 100 : 0}%;background:{BANDS[m.band].color}"></div></div>
          <span class="rpct">{m.attempts ? Math.round(m.score * 100) + '%' : '–'}</span>
        </div>
      {/each}
    </div>
    <p class="note">Bands mirror PMI's score report. Mastery weights recent answers and harder questions more. A band appears after 3 answers on that task.</p>
  {/if}
</div>

<style>
  .progress { padding: calc(16px + var(--safe-top)) 16px 24px; }
  h1 { margin: 6px 4px 14px; font-size: 1.6rem; font-weight: 900; }
  .empty { text-align: center; color: var(--muted); font-weight: 700; padding: 30px 16px; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .s { text-align: center; padding: 12px 6px; }
  .s strong { display: block; font-size: 1.4rem; font-weight: 900; }
  .s small { color: var(--muted); font-weight: 800; font-size: 0.75rem; }
  .ready { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
  .ready strong { display: block; font-size: 2rem; font-weight: 900; }
  .ready small { display: block; color: var(--muted); font-weight: 700; font-size: 0.78rem; }

  .spark { width: 100%; height: 80px; display: block; }
  .spark .line { fill: none; stroke: var(--green); stroke-width: 3; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .spark .target { stroke: var(--blue); stroke-dasharray: 5 4; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
  .caption { margin: 6px 0 0; font-size: 0.75rem; color: var(--muted); font-weight: 700; }

  .weak { display: flex; flex-direction: column; gap: 12px; }
  .wrow { display: flex; align-items: center; gap: 10px; }
  .rank {
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--red-soft);
    color: var(--red-dark);
    font-weight: 900;
    font-size: 0.8rem;
  }
  .wtext { flex: 1; min-width: 0; }
  .wtext strong { display: block; font-size: 0.9rem; font-weight: 800; }
  .wtext small { color: var(--muted); font-weight: 700; font-size: 0.75rem; }

  .domain { margin-bottom: 10px; border-left: 6px solid var(--dc); }
  .dhead { all: unset; display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer; }
  .dhead strong { display: block; font-weight: 900; }
  .dhead small { color: var(--muted); font-weight: 700; font-size: 0.75rem; }
  .pct { font-size: 1.3rem; font-weight: 900; color: var(--dc); }
  .bar { height: 10px; background: var(--line); border-radius: 999px; overflow: hidden; margin-top: 8px; }
  .bar.thin { height: 7px; margin-top: 5px; }
  .bar-fill { height: 100%; background: var(--dc); border-radius: 999px; }
  .tasks { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
  .trow { display: flex; align-items: center; gap: 10px; }
  .ttext { flex: 1; min-width: 0; font-size: 0.82rem; font-weight: 700; }

  .rows { display: flex; flex-direction: column; gap: 10px; }
  .row { display: flex; align-items: center; gap: 10px; }
  .rlabel { width: 130px; font-size: 0.85rem; font-weight: 800; }
  .grow { flex: 1; margin-top: 0; }
  .rpct { width: 40px; text-align: right; font-weight: 900; font-size: 0.85rem; }
  .note { font-size: 0.75rem; color: var(--muted); font-weight: 700; margin: 14px 4px 0; line-height: 1.4; }
</style>
