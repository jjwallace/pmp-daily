<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { app, streak, today, addDays } from '$lib/store.svelte';
  import { readiness, sessionScore, weakest } from '$lib/analytics';
  import { domainColor, domainName, taskName } from '$lib/blueprint';
  import BandChip from '$lib/components/BandChip.svelte';

  let { onstart, ondrill }: { onstart: (mode: 'daily' | 'practice') => void; ondrill: (tasks: string[]) => void } = $props();

  const st = $derived(streak());
  const ready = $derived(readiness(app.sessions));
  const todays = $derived(app.sessions.filter((s) => s.date === today() && s.mode === 'daily'));
  const weak = $derived(weakest(app.sessions, 3).filter((t) => t.attempts > 0));
  const daysToExam = $derived.by(() => {
    if (!app.settings.examDate) return null;
    return Math.ceil((Date.parse(app.settings.examDate) - Date.parse(today())) / 86400000);
  });
  const week = $derived.by(() => {
    const done = new Set(app.sessions.filter((s) => s.mode === 'daily').map((s) => s.date));
    return [...Array(7)].map((_, i) => {
      const d = addDays(today(), i - 6);
      const [y, m, dd] = d.split('-').map(Number);
      return { d, done: done.has(d), label: 'SMTWTFS'[new Date(y, m - 1, dd).getDay()], isToday: i === 6 };
    });
  });

  // Semicircle gauge
  const GR = 80;
  const GL = Math.PI * GR;

  let root: HTMLElement;
  let gauge: SVGPathElement;
  let startBtn = $state<HTMLElement>();

  onMount(() => {
    const ctx = gsap.context(() => {
      gsap.from(root.querySelectorAll('.pop'), { y: 24, opacity: 0, stagger: 0.07, duration: 0.5, ease: 'back.out(1.5)' });
      gsap.fromTo(gauge, { strokeDashoffset: GL }, { strokeDashoffset: GL * (1 - (app.sessions.length ? ready.score : 0)), duration: 1.3, ease: 'power3.out', delay: 0.2 });
      if (startBtn) gsap.to(startBtn, { scale: 1.035, duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1 });
    }, root);
    return () => ctx.revert();
  });
</script>

<div class="home" bind:this={root}>
  <header class="top pop">
    <div class="stat flame" class:lit={st.doneToday}>
      <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z" fill="currentColor" /></svg>
      {st.current}
    </div>
    <div class="brand">PMP Daily</div>
    <div class="stat gem">
      <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l9 7-9 13L3 9z" fill="currentColor" /></svg>
      {app.xp}
    </div>
  </header>

  <div class="week pop">
    {#each week as w}
      <div class="day" class:done={w.done} class:today={w.isToday}>
        <span>{w.label}</span>
        <i>{w.done ? '✓' : ''}</i>
      </div>
    {/each}
  </div>

  <section class="hero pop">
    {#if todays.length}
      <div class="done-badge">✓</div>
      <h1>Daily quiz done!</h1>
      <p>You scored <strong>{Math.round(sessionScore(todays[todays.length - 1]) * 100)}%</strong> today. Come back tomorrow to keep your streak.</p>
      <button class="btn blue" onclick={() => onstart('practice')}>Practice 15 more</button>
    {:else}
      <div class="hero-icon">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <rect x="8" y="6" width="48" height="54" rx="10" fill="var(--green)" />
          <rect x="14" y="12" width="36" height="42" rx="6" fill="#fff" />
          <path d="M20 24h24M20 33h24M20 42h14" stroke="var(--line)" stroke-width="4" stroke-linecap="round" />
          <circle cx="46" cy="46" r="11" fill="var(--yellow)" />
          <path d="M41 46l3.5 3.5L51 43" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h1>Today's PMP quiz</h1>
      <p>15 questions · weighted like the 2026 exam · includes a case study</p>
      <div bind:this={startBtn}>
        <button class="btn start" onclick={() => onstart('daily')}>Start</button>
      </div>
    {/if}
    {#if daysToExam != null}
      <p class="countdown">{daysToExam > 0 ? `${daysToExam} days until your exam` : daysToExam === 0 ? 'Exam day! You got this.' : 'Exam date has passed'}</p>
    {/if}
  </section>

  <section class="card readiness pop">
    <svg viewBox="0 0 200 110" width="180">
      <path d="M20 100 A80 80 0 0 1 180 100" class="g-bg" />
      <path bind:this={gauge} d="M20 100 A80 80 0 0 1 180 100" class="g-fg" stroke-dasharray={GL} stroke-dashoffset={GL * (1 - (app.sessions.length ? ready.score : 0))} />
      <text x="100" y="92" text-anchor="middle" class="g-num">{app.sessions.length ? Math.round(ready.score * 100) + '%' : '–'}</text>
    </svg>
    <div class="r-text">
      <strong>Exam readiness</strong>
      <BandChip band={ready.band} />
      <small>{Math.round(ready.coverage * 100)}% of the 26 exam tasks practiced</small>
    </div>
  </section>

  {#if weak.length}
    <h2 class="section-title pop">Needs attention</h2>
    <section class="card weak pop">
      {#each weak as t}
        <div class="wrow">
          <span class="dot" style="background:{domainColor(t.domain)}"></span>
          <div class="wtext">
            <strong>{taskName(t.domain, t.task)}</strong>
            <small>{domainName(t.domain)} · {Math.round(t.score * 100)}%</small>
          </div>
          <BandChip band={t.band} />
        </div>
      {/each}
      <button class="btn orange small" onclick={() => ondrill(weak.map((t) => t.key))}>Drill weak areas</button>
    </section>
  {/if}
</div>

<style>
  .home { padding: calc(10px + var(--safe-top)) 16px 24px; }
  .top { display: flex; align-items: center; justify-content: space-between; padding: 6px 0 12px; }
  .brand { font-weight: 900; font-size: 1.1rem; color: var(--green); letter-spacing: 0.02em; }
  .stat { display: flex; align-items: center; gap: 4px; font-weight: 900; font-size: 1.05rem; }
  .flame { color: var(--line); }
  .flame.lit { color: var(--orange); }
  .gem { color: var(--blue); }

  .week { display: flex; justify-content: space-between; gap: 6px; margin-bottom: 14px; }
  .day {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 900;
    color: var(--muted);
  }
  .day i {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--bg-soft);
    border: 2px solid var(--line);
    font-style: normal;
    color: #fff;
  }
  .day.done i { background: var(--orange); border-color: var(--orange); }
  .day.today span { color: var(--orange); }

  .hero {
    text-align: center;
    padding: 22px 18px 20px;
    border-radius: 24px;
    background: linear-gradient(160deg, color-mix(in srgb, var(--green) 16%, var(--card)), var(--card));
    border: 2px solid color-mix(in srgb, var(--green) 45%, var(--line));
  }
  .hero h1 { margin: 8px 0 6px; font-size: 1.5rem; font-weight: 900; }
  .hero p { margin: 0 0 16px; color: var(--muted); font-weight: 700; font-size: 0.92rem; }
  .start { font-size: 1.15rem; padding: 16px; }
  .done-badge {
    width: 64px;
    height: 64px;
    margin: 0 auto;
    border-radius: 50%;
    background: var(--green);
    color: #fff;
    font-size: 2rem;
    font-weight: 900;
    display: grid;
    place-items: center;
    box-shadow: 0 4px 0 var(--green-dark);
  }
  .countdown { margin: 12px 0 0 !important; color: var(--purple) !important; font-weight: 900 !important; }

  .readiness { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
  .g-bg { fill: none; stroke: var(--line); stroke-width: 16; stroke-linecap: round; }
  .g-fg { fill: none; stroke: var(--blue); stroke-width: 16; stroke-linecap: round; }
  .g-num { font-size: 28px; font-weight: 900; fill: var(--text); }
  .r-text { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
  .r-text strong { font-size: 1.05rem; font-weight: 900; }
  .r-text small { color: var(--muted); font-weight: 700; font-size: 0.78rem; }

  .weak { display: flex; flex-direction: column; gap: 12px; }
  .wrow { display: flex; align-items: center; gap: 10px; }
  .dot { flex: none; width: 10px; height: 10px; border-radius: 50%; }
  .wtext { flex: 1; min-width: 0; }
  .wtext strong { display: block; font-size: 0.9rem; font-weight: 800; }
  .wtext small { color: var(--muted); font-weight: 700; font-size: 0.75rem; }
  .weak .btn { align-self: flex-start; }
</style>
