<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import type { Session } from '$lib/types';
  import { DOMAINS, domainColor, domainName, taskKey, taskName } from '$lib/blueprint';
  import { BY_ID } from '$lib/questions';
  import { app, streak } from '$lib/store.svelte';
  import { readiness, sessionScore, taskMastery } from '$lib/analytics';
  import { confetti, haptic, sound } from '$lib/fx';
  import BandChip from '$lib/components/BandChip.svelte';

  let {
    session,
    onreview,
    ondone,
    ondrill,
  }: { session: Session; onreview: () => void; ondone: () => void; ondrill: (tasks: string[]) => void } = $props();

  const score = sessionScore(session);
  const pct = Math.round(score * 100);
  const correct = session.attempts.filter((a) => a.correct).length;
  const mins = Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000));
  const st = streak();
  const ready = readiness(app.sessions);

  const byDomain = DOMAINS.map((d) => {
    const as = session.attempts.filter((a) => BY_ID.get(a.qid)?.domain === d.id);
    return { ...d, n: as.length, c: as.filter((a) => a.correct).length };
  }).filter((d) => d.n > 0);

  // Tasks missed today, enriched with their overall mastery
  const mastery = new Map(taskMastery(app.sessions).map((t) => [t.key, t]));
  const missed = [
    ...new Set(
      session.attempts
        .filter((a) => !a.correct)
        .map((a) => BY_ID.get(a.qid)!)
        .map((q) => taskKey(q.domain, q.task)),
    ),
  ]
    .map((k) => mastery.get(k)!)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  const headline = pct >= 90 ? 'Outstanding!' : pct >= 75 ? 'Great work!' : pct >= 60 ? 'Nice effort!' : 'Keep going!';

  let ring: SVGCircleElement;
  let pctEl: HTMLElement;
  let xpEl: HTMLElement;
  let root: HTMLElement;
  const R = 70;
  const C = 2 * Math.PI * R;

  onMount(() => {
    sound('complete');
    haptic('success');
    const pctCounter = { v: 0 };
    const xpCounter = { v: 0 };
    const tl = gsap.timeline();
    tl.from(root.querySelector('.hero-title'), { y: -30, opacity: 0, scale: 0.7, duration: 0.6, ease: 'back.out(2)' })
      .fromTo(ring, { strokeDashoffset: C }, { strokeDashoffset: C * (1 - score), duration: 1.4, ease: 'power3.out' }, '-=0.2')
      .to(pctCounter, { v: pct, duration: 1.4, ease: 'power3.out', onUpdate: () => { if (pctEl) pctEl.textContent = `${Math.round(pctCounter.v)}%`; } }, '<')
      .from(root.querySelectorAll('.tile'), { y: 30, opacity: 0, scale: 0.8, stagger: 0.1, duration: 0.5, ease: 'back.out(1.8)' }, '-=0.9')
      .to(xpCounter, { v: session.xp, duration: 1, ease: 'power2.out', onUpdate: () => { if (xpEl) xpEl.textContent = `+${Math.round(xpCounter.v)}`; } }, '<')
      .from(root.querySelectorAll('.dbar-fill'), { width: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from(root.querySelectorAll('.reveal'), { y: 24, opacity: 0, stagger: 0.08, duration: 0.45, ease: 'power2.out' }, '-=0.6');
    const t = pct >= 70 ? setTimeout(() => confetti(pct >= 90 ? 220 : 140), 700) : undefined;
    return () => {
      tl.kill();
      clearTimeout(t);
    };
  });
</script>

<div class="results" bind:this={root}>
  <div class="scroll">
    <h1 class="hero-title">{headline}</h1>
    <p class="sub">{session.mode === 'daily' ? 'Daily quiz complete' : session.mode === 'drill' ? 'Weakness drill complete' : 'Practice complete'}</p>

    <div class="ring-wrap">
      <svg viewBox="0 0 180 180" width="190" height="190">
        <circle cx="90" cy="90" r={R} class="ring-bg" />
        <circle
          bind:this={ring}
          cx="90" cy="90" r={R}
          class="ring-fg"
          class:low={pct < 60}
          stroke-dasharray={C}
          stroke-dashoffset={C * (1 - score)}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div class="ring-label">
        <strong bind:this={pctEl}>{pct}%</strong>
        <span>{correct} / {session.attempts.length} correct</span>
      </div>
    </div>

    <div class="tiles">
      <div class="tile xp"><span class="tl">Total XP</span><strong bind:this={xpEl}>+{session.xp}</strong></div>
      <div class="tile combo"><span class="tl">Best combo</span><strong>🔥 {session.bestCombo}</strong></div>
      <div class="tile time"><span class="tl">Time</span><strong>⏱ {mins}m</strong></div>
    </div>

    {#if session.mode === 'daily'}
      <div class="streak reveal">
        <span class="flame">🔥</span>
        <div><strong>{st.current} day streak!</strong><small>Best: {st.best} {st.best === 1 ? 'day' : 'days'}</small></div>
      </div>
    {/if}

    <h2 class="section-title reveal">By domain</h2>
    <div class="card reveal domains">
      {#each byDomain as d}
        <div class="drow">
          <div class="dlabel"><span>{d.name}</span><span>{d.c}/{d.n}</span></div>
          <div class="dbar"><div class="dbar-fill" style="width:{(d.c / d.n) * 100}%;background:{d.color}"></div></div>
        </div>
      {/each}
    </div>

    {#if missed.length}
      <h2 class="section-title reveal">Focus areas</h2>
      <p class="fsub reveal">The tasks you missed today, weakest first</p>
      <div class="card reveal focus">
        {#each missed as t}
          <div class="frow">
            <span class="dot" style="background:{domainColor(t.domain)}"></span>
            <div class="ftext">
              <strong>{taskName(t.domain, t.task)}</strong>
              <small>{domainName(t.domain)} · Task {t.task} · {Math.round(t.score * 100)}% mastery</small>
            </div>
            {#if t.band !== 'none'}<BandChip band={t.band} />{/if}
          </div>
        {/each}
        <button class="btn orange small drill" onclick={() => ondrill(missed.map((t) => t.key))}>Drill these</button>
      </div>
    {:else}
      <div class="card reveal perfect">Perfect round. No new weak spots today.</div>
    {/if}

    <h2 class="section-title reveal">Exam readiness</h2>
    <div class="card reveal ready">
      <div>
        <strong>{Math.round(ready.score * 100)}%</strong>
        <small>{Math.round(ready.coverage * 100)}% of exam tasks practiced</small>
      </div>
      <BandChip band={ready.band} />
    </div>
  </div>

  <footer>
    <button class="btn ghost" onclick={onreview}>Review</button>
    <button class="btn" onclick={ondone}>Continue</button>
  </footer>
</div>

<style>
  .results {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    max-width: 640px;
    margin: 0 auto;
    background: var(--bg);
  }
  .scroll {
    flex: 1;
    overflow-y: auto;
    padding: calc(24px + var(--safe-top)) 16px 24px;
  }
  .hero-title {
    margin: 0;
    text-align: center;
    font-size: 2rem;
    font-weight: 900;
    color: var(--yellow);
    text-shadow: 0 3px 0 color-mix(in srgb, var(--yellow) 50%, #000);
  }
  .sub { text-align: center; margin: 4px 0 8px; font-weight: 800; color: var(--muted); }
  .ring-wrap { position: relative; width: 190px; height: 190px; margin: 0 auto; }
  .ring-bg { fill: none; stroke: var(--line); stroke-width: 16; }
  .ring-fg { fill: none; stroke: var(--green); stroke-width: 16; stroke-linecap: round; }
  .ring-fg.low { stroke: var(--orange); }
  .ring-label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .ring-label strong { font-size: 2.6rem; font-weight: 900; line-height: 1; }
  .ring-label span { font-size: 0.8rem; font-weight: 800; color: var(--muted); margin-top: 4px; }

  .tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 18px; }
  .tile {
    --tc: var(--yellow);
    border: 2px solid var(--tc);
    border-radius: 16px;
    overflow: hidden;
    text-align: center;
    background: var(--card);
  }
  .tile.combo { --tc: var(--orange); }
  .tile.time { --tc: var(--blue); }
  .tl {
    display: block;
    background: var(--tc);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px;
  }
  .tile strong { display: block; padding: 10px 4px; font-size: 1.25rem; font-weight: 900; color: var(--tc); }

  .streak {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--orange) 14%, var(--card));
    border: 2px solid color-mix(in srgb, var(--orange) 60%, var(--line));
  }
  .flame { font-size: 2rem; }
  .streak strong { display: block; font-size: 1.1rem; font-weight: 900; color: var(--orange); }
  .streak small { font-weight: 700; color: var(--muted); }

  .domains { display: flex; flex-direction: column; gap: 12px; }
  .dlabel { display: flex; justify-content: space-between; font-weight: 800; font-size: 0.9rem; margin-bottom: 5px; }
  .dbar { height: 12px; background: var(--line); border-radius: 999px; overflow: hidden; }
  .dbar-fill { height: 100%; border-radius: 999px; }

  .focus { display: flex; flex-direction: column; gap: 12px; }
  .frow { display: flex; align-items: center; gap: 10px; }
  .dot { flex: none; width: 10px; height: 10px; border-radius: 50%; }
  .ftext { flex: 1; min-width: 0; }
  .ftext strong { display: block; font-size: 0.9rem; font-weight: 800; }
  .ftext small { color: var(--muted); font-weight: 700; font-size: 0.75rem; }
  .drill { align-self: flex-start; }
  .fsub { margin: -6px 4px 10px; color: var(--muted); font-weight: 700; font-size: 0.82rem; }
  .perfect { font-weight: 800; color: var(--green); text-align: center; }

  .ready { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .ready strong { font-size: 1.6rem; font-weight: 900; display: block; }
  .ready small { color: var(--muted); font-weight: 700; }

  footer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 12px 16px calc(14px + var(--safe-bottom));
    border-top: 2px solid var(--line);
  }
</style>
