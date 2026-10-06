<script lang="ts">
  import { tick } from 'svelte';
  import { gsap } from 'gsap';
  import type { Attempt, Question, Session, SessionMode } from '$lib/types';
  import { app, recordSession } from '$lib/store.svelte';
  import { buildQuiz } from '$lib/quizgen';
  import { BY_ID } from '$lib/questions';
  import Home from '$lib/screens/Home.svelte';
  import Quiz from '$lib/screens/Quiz.svelte';
  import Results from '$lib/screens/Results.svelte';
  import Progress from '$lib/screens/Progress.svelte';
  import History from '$lib/screens/History.svelte';
  import Review from '$lib/screens/Review.svelte';
  import Settings from '$lib/screens/Settings.svelte';

  type Tab = 'home' | 'progress' | 'history' | 'settings';
  type Screen =
    | { kind: 'tab'; tab: Tab }
    | { kind: 'quiz'; mode: SessionMode; questions: Question[] }
    | { kind: 'results'; session: Session }
    | { kind: 'review'; session: Session; back: Screen };

  let screen = $state<Screen>({ kind: 'tab', tab: 'home' });
  let tabKey = $state(0);
  let main: HTMLElement | undefined = $state();

  async function go(next: Screen) {
    screen = next;
    tabKey++;
    await tick();
    main?.scrollTo({ top: 0 });
  }

  function start(mode: SessionMode, focusTasks?: string[]) {
    go({ kind: 'quiz', mode, questions: buildQuiz(app, mode, { focusTasks }) });
  }

  // Dev only: /?q=id1,id2 opens a practice quiz with exactly those questions
  if (import.meta.env.DEV) {
    const ids = new URLSearchParams(location.search).get('q')?.split(',') ?? [];
    const qs = ids.map((id) => BY_ID.get(id)).filter((q): q is Question => !!q);
    if (qs.length) screen = { kind: 'quiz', mode: 'practice', questions: qs };
  }

  function finish(mode: SessionMode, attempts: Attempt[], startedAt: number, xp: number, bestCombo: number) {
    const session = recordSession(mode, attempts, startedAt, xp, bestCombo);
    go({ kind: 'results', session });
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: 'Learn', icon: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z' },
    { id: 'progress', label: 'Progress', icon: 'M5 20V11M12 20V5M19 20v-7' },
    { id: 'history', label: 'History', icon: 'M12 7v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z' },
    { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4' },
  ];

  function tabTap(t: Tab, e: MouseEvent) {
    gsap.fromTo(e.currentTarget as Element, { scale: 0.85 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
    go({ kind: 'tab', tab: t });
  }
</script>

{#if screen.kind === 'quiz'}
  {@const s = screen}
  <Quiz
    questions={s.questions}
    mode={s.mode}
    onfinish={(a, st, xp, combo) => finish(s.mode, a, st, xp, combo)}
    onquit={() => go({ kind: 'tab', tab: 'home' })}
  />
{:else if screen.kind === 'results'}
  {@const s = screen}
  <Results
    session={s.session}
    onreview={() => go({ kind: 'review', session: s.session, back: s })}
    ondone={() => go({ kind: 'tab', tab: 'home' })}
    ondrill={(tasks) => start('drill', tasks)}
  />
{:else if screen.kind === 'review'}
  {@const s = screen}
  <Review session={s.session} onback={() => go(s.back)} />
{:else}
  {@const tab = screen.tab}
  <div class="shell">
    <main bind:this={main}>
      {#key tabKey}
        {#if tab === 'home'}
          <Home onstart={(m) => start(m)} ondrill={(t) => start('drill', t)} />
        {:else if tab === 'progress'}
          <Progress ondrill={(t) => start('drill', t)} />
        {:else if tab === 'history'}
          <History onopen={(session) => go({ kind: 'review', session, back: { kind: 'tab', tab: 'history' } })} />
        {:else}
          <Settings />
        {/if}
      {/key}
    </main>
    <nav>
      {#each TABS as t}
        <button class:active={tab === t.id} onclick={(e) => tabTap(t.id, e)}>
          <svg viewBox="0 0 24 24" width="26" height="26"><path d={t.icon} fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <span>{t.label}</span>
        </button>
      {/each}
    </nav>
  </div>
{/if}

<style>
  .shell {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    max-width: 640px;
    margin: 0 auto;
  }
  main {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  nav {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 2px solid var(--line);
    padding: 6px 8px calc(6px + var(--safe-bottom));
    background: var(--bg);
  }
  nav button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 0;
    background: none;
    border: 2px solid transparent;
    border-radius: 14px;
    color: var(--muted);
    font-weight: 900;
    font-size: 0.68rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    cursor: pointer;
  }
  nav button.active {
    color: var(--blue);
    background: var(--blue-soft);
    border-color: color-mix(in srgb, var(--blue) 50%, transparent);
  }
</style>
