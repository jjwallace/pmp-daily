<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { gsap } from 'gsap';
  import type { Attempt, Question, Response, SessionMode } from '$lib/types';
  import { domainColor, domainName, taskName } from '$lib/blueprint';
  import { CASE_BY_ID } from '$lib/questions';
  import { correctAnswerText, isCorrect } from '$lib/grade';
  import { haptic, sound } from '$lib/fx';
  import QuestionView from '$lib/components/QuestionView.svelte';
  import Graphic from '$lib/components/Graphic.svelte';

  let {
    questions,
    mode,
    onfinish,
    onquit,
  }: {
    questions: Question[];
    mode: SessionMode;
    onfinish: (attempts: Attempt[], startedAt: number, xp: number, bestCombo: number) => void;
    onquit: () => void;
  } = $props();

  const startedAt = Date.now();
  let index = $state(0);
  let response = $state<Response | null>(null);
  let revealed = $state(false);
  let lastCorrect = $state(false);
  let attempts = $state<Attempt[]>([]);
  let combo = $state(0);
  let bestCombo = $state(0);
  let xp = $state(0);
  let qStart = Date.now();
  let showQuit = $state(false);
  let caseOpen = $state(true);
  let toast = $state('');

  let card: HTMLElement;
  let sheet = $state<HTMLElement>();
  let bar: HTMLElement;
  let comboEl = $state<HTMLElement>();
  let toastEl = $state<HTMLElement>();

  const q = $derived(questions[index]);
  const cs = $derived(q.caseId ? CASE_BY_ID.get(q.caseId) : undefined);
  const casePos = $derived.by(() => {
    if (!q.caseId) return null;
    const group = questions.filter((x) => x.caseId === q.caseId);
    return { n: group.findIndex((x) => x.id === q.id) + 1, total: group.length };
  });

  function enter() {
    gsap.fromTo(card, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
    gsap.fromTo(
      card.querySelectorAll('.anim-in'),
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.6)', delay: 0.1 },
    );
  }

  onMount(() => {
    enter();
    gsap.fromTo(bar, { width: '0%' }, { width: `${(0 / questions.length) * 100}%`, duration: 0.3 });
  });

  function check() {
    if (!response || revealed) return;
    const ok = isCorrect(q, response);
    lastCorrect = ok;
    revealed = true;
    attempts.push({ qid: q.id, correct: ok, ms: Date.now() - qStart, response });

    if (ok) {
      combo++;
      bestCombo = Math.max(bestCombo, combo);
      const gained = 10 + 5 * (q.difficulty - 1) + Math.min(combo - 1, 5) * 2;
      xp += gained;
      sound(combo >= 3 && combo % 3 === 0 ? 'combo' : 'correct');
      haptic('success');
      if (combo >= 3 && combo % 3 === 0) flashToast(`🔥 ${combo} in a row!`);
      tick().then(() => {
        if (comboEl) gsap.fromTo(comboEl, { scale: 1.6, rotate: -12 }, { scale: 1, rotate: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        const picked = card.querySelectorAll('.correct');
        gsap.fromTo(picked, { scale: 1 }, { scale: 1.04, duration: 0.14, yoyo: true, repeat: 1, ease: 'power1.inOut' });
      });
    } else {
      combo = 0;
      sound('wrong');
      haptic('error');
      gsap.to(card, { keyframes: { x: [0, -12, 12, -8, 8, -4, 0] }, duration: 0.45, ease: 'none' });
    }

    gsap.to(bar, { width: `${((index + 1) / questions.length) * 100}%`, duration: 0.7, ease: 'elastic.out(1, 0.6)' });
    tick().then(() => {
      if (sheet) gsap.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: 0.38, ease: 'power3.out' });
    });
  }

  function flashToast(msg: string) {
    toast = msg;
    tick().then(() => {
      if (!toastEl) return;
      gsap.timeline({ onComplete: () => (toast = '') })
        .fromTo(toastEl, { y: -30, opacity: 0, scale: 0.6 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' })
        .to(toastEl, { opacity: 0, y: -20, duration: 0.3, delay: 1.1 });
    });
  }

  async function next() {
    haptic('tap');
    if (index + 1 >= questions.length) {
      onfinish(attempts, startedAt, xp + (mode === 'daily' ? 20 : 10), bestCombo);
      return;
    }
    const nextQ = questions[index + 1];
    const newCase = nextQ.caseId && nextQ.caseId !== q.caseId;
    if (sheet) await gsap.to(sheet, { yPercent: 100, duration: 0.22, ease: 'power2.in' });
    await gsap.to(card, { x: -60, opacity: 0, duration: 0.2, ease: 'power2.in' });
    index++;
    response = null;
    revealed = false;
    qStart = Date.now();
    if (newCase) caseOpen = true;
    await tick();
    card.scrollTop = 0;
    document.querySelector('.quiz-scroll')?.scrollTo({ top: 0 });
    enter();
  }

  function onkey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      if (revealed) next();
      else check();
    }
  }

  const diffLabel = ['', 'Easy', 'Medium', 'Hard'];
</script>

<svelte:window onkeydown={onkey} />

<div class="quiz">
  <header>
    <button class="icon" aria-label="Quit" onclick={() => (showQuit = true)}>
      <svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
    </button>
    <div class="track"><div class="fill" bind:this={bar}><span class="shine"></span></div></div>
    <div class="combo" class:hot={combo >= 3} bind:this={comboEl}>
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z" fill="currentColor" /></svg>
      {combo}
    </div>
  </header>

  {#if toast}<div class="toast" bind:this={toastEl}>{toast}</div>{/if}

  <div class="quiz-scroll">
    <div class="qcard" bind:this={card}>
      <div class="meta anim-in">
        <span class="chip" style="color:{domainColor(q.domain)};border-color:{domainColor(q.domain)}">{domainName(q.domain)}</span>
        <span class="chip">{q.approach[0].toUpperCase() + q.approach.slice(1)}</span>
        <span class="chip diff d{q.difficulty}">
          {#each [1, 2, 3] as d}<i class:on={d <= q.difficulty}></i>{/each}
          {diffLabel[q.difficulty]}
        </span>
        <span class="count">{index + 1}/{questions.length}</span>
      </div>
      <p class="task anim-in">Task {q.task}: {taskName(q.domain, q.task)}</p>

      {#if cs && casePos}
        <section class="case anim-in">
          <button class="case-head" onclick={() => (caseOpen = !caseOpen)}>
            <span class="case-badge">Case study · {casePos.n} of {casePos.total}</span>
            <strong>{cs.title}</strong>
            <span class="caret" class:open={caseOpen}>▾</span>
          </button>
          {#if caseOpen}
            <p class="scenario">{cs.scenario}</p>
            {#if cs.graphic && cs.graphic.kind !== q.graphic?.kind}
              <Graphic graphic={cs.graphic} />
            {/if}
          {/if}
        </section>
      {/if}

      {#key q.id}
        <QuestionView question={q} {revealed} seed={index + 7} onchange={(r) => (response = r)} />
      {/key}
    </div>
  </div>

  <footer class:hidden={revealed}>
    <button class="btn" disabled={!response} onclick={check}>Check</button>
  </footer>

  {#if revealed}
    <div class="sheet" class:ok={lastCorrect} class:bad={!lastCorrect} bind:this={sheet}>
      <div class="sheet-head">
        <span class="badge">
          {#if lastCorrect}
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          {:else}
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" /></svg>
          {/if}
        </span>
        <h3>{lastCorrect ? ['Nice!', 'Excellent!', 'Great job!', 'Spot on!'][index % 4] : 'Not quite'}</h3>
      </div>
      {#if !lastCorrect}
        <p class="correct-ans"><strong>Correct answer:</strong><br /><span>{correctAnswerText(q)}</span></p>
      {/if}
      <p class="why">{q.explanation}</p>
      <button class="btn" class:red={!lastCorrect} onclick={next}>
        {index + 1 >= questions.length ? 'Finish' : 'Continue'}
      </button>
    </div>
  {/if}

  {#if showQuit}
    <div class="modal-bg" role="presentation" onclick={() => (showQuit = false)}>
      <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
        <h3>Wait, don't go!</h3>
        <p>You'll lose your progress on this quiz if you quit now.</p>
        <button class="btn blue" onclick={() => (showQuit = false)}>Keep learning</button>
        <button class="btn ghost quit" onclick={onquit}>End session</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .quiz {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    max-width: 640px;
    margin: 0 auto;
    background: var(--bg);
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: calc(12px + var(--safe-top)) 16px 10px;
  }
  .icon {
    background: none;
    border: none;
    color: var(--muted);
    padding: 4px;
    cursor: pointer;
    display: grid;
  }
  .track {
    flex: 1;
    height: 16px;
    background: var(--line);
    border-radius: 999px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    width: 0;
    background: var(--green);
    border-radius: 999px;
    position: relative;
  }
  .shine {
    position: absolute;
    left: 8px;
    right: 8px;
    top: 4px;
    height: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.35);
  }
  .combo {
    display: flex;
    align-items: center;
    gap: 3px;
    font-weight: 900;
    color: var(--line);
    min-width: 40px;
  }
  .combo.hot { color: var(--orange); }

  .toast {
    position: fixed;
    top: calc(64px + var(--safe-top));
    left: 50%;
    translate: -50% 0;
    background: var(--orange);
    color: #fff;
    font-weight: 900;
    padding: 8px 16px;
    border-radius: 999px;
    box-shadow: 0 4px 0 #cc7900;
    z-index: 20;
  }

  .quiz-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 6px 16px 24px;
    -webkit-overflow-scrolling: touch;
  }
  .qcard { display: flex; flex-direction: column; gap: 12px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .count { margin-left: auto; font-weight: 900; color: var(--muted); font-size: 0.85rem; }
  .diff i {
    display: inline-block;
    width: 5px;
    height: 10px;
    border-radius: 2px;
    background: var(--line);
  }
  .diff i.on { background: currentColor; }
  .diff.d1 { color: var(--green); }
  .diff.d2 { color: var(--orange); }
  .diff.d3 { color: var(--red); }
  .task {
    margin: -4px 2px 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--muted);
  }

  .case {
    background: color-mix(in srgb, var(--purple) 10%, var(--card));
    border: 2px solid color-mix(in srgb, var(--purple) 50%, var(--line));
    border-radius: 18px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .case-head {
    all: unset;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 8px;
    cursor: pointer;
  }
  .case-badge {
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--purple);
  }
  .case-head strong { grid-column: 1; font-size: 0.98rem; }
  .caret { grid-row: 1 / span 2; grid-column: 2; align-self: center; transition: rotate 0.2s; color: var(--purple); }
  .caret.open { rotate: 180deg; }
  .scenario { margin: 0; font-size: 0.92rem; line-height: 1.5; font-weight: 600; }

  footer {
    padding: 12px 16px calc(14px + var(--safe-bottom));
    border-top: 2px solid var(--line);
    background: var(--bg);
  }
  footer.hidden { visibility: hidden; }

  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: 640px;
    margin: 0 auto;
    padding: 18px 16px calc(16px + var(--safe-bottom));
    border-radius: 22px 22px 0 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 62vh;
    overflow-y: auto;
    z-index: 10;
  }
  .sheet.ok { background: var(--green-soft); color: var(--green-dark); }
  .sheet.bad { background: var(--red-soft); color: var(--red-dark); }
  .sheet-head { display: flex; align-items: center; gap: 10px; }
  .sheet h3 { margin: 0; font-size: 1.35rem; font-weight: 900; }
  .badge {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--card);
  }
  .correct-ans { margin: 0; font-size: 0.95rem; white-space: pre-line; }
  .correct-ans span { font-weight: 700; }
  .why { margin: 0; font-size: 0.9rem; line-height: 1.45; color: var(--text); font-weight: 600; }

  .modal-bg {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: grid;
    place-items: end center;
    z-index: 50;
  }
  .modal {
    width: 100%;
    max-width: 640px;
    background: var(--bg);
    border-radius: 22px 22px 0 0;
    padding: 24px 16px calc(18px + var(--safe-bottom));
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  .modal h3 { margin: 0; font-size: 1.3rem; font-weight: 900; }
  .modal p { margin: 0 0 6px; color: var(--muted); font-weight: 700; }
  .quit { color: var(--red); }
</style>
