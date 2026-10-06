<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { app } from '$lib/store.svelte';
  import { sessionScore } from '$lib/analytics';
  import type { Session } from '$lib/types';

  let { onopen }: { onopen: (s: Session) => void } = $props();

  const list = [...app.sessions].reverse();
  const MODE = { daily: 'Daily quiz', practice: 'Practice', drill: 'Weakness drill' };
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  let root: HTMLElement;
  onMount(() => {
    gsap.from(root.querySelectorAll('.item'), { x: -20, opacity: 0, stagger: 0.04, duration: 0.35, ease: 'power2.out' });
  });
</script>

<div class="history" bind:this={root}>
  <h1>All tests</h1>
  {#if !list.length}
    <div class="card empty">No quizzes yet. Your results will be saved here.</div>
  {/if}
  {#each list as s}
    {@const pct = Math.round(sessionScore(s) * 100)}
    <button class="item card" onclick={() => onopen(s)}>
      <div class="score" class:good={pct >= 68} class:mid={pct >= 55 && pct < 68}>{pct}%</div>
      <div class="info">
        <strong>{MODE[s.mode]}</strong>
        <small>{fmt(s.date)} · {s.attempts.filter((a) => a.correct).length}/{s.attempts.length} · +{s.xp} XP</small>
      </div>
      <span class="chev">›</span>
    </button>
  {/each}
</div>

<style>
  .history { padding: calc(16px + var(--safe-top)) 16px 24px; display: flex; flex-direction: column; gap: 10px; }
  h1 { margin: 6px 4px 6px; font-size: 1.6rem; font-weight: 900; }
  .empty { text-align: center; color: var(--muted); font-weight: 700; padding: 30px 16px; }
  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
    border-bottom-width: 4px;
  }
  .item:active { transform: translateY(2px); }
  .score {
    flex: none;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    font-weight: 900;
    background: var(--red-soft);
    color: var(--red-dark);
  }
  .score.mid { background: color-mix(in srgb, var(--orange) 18%, var(--card)); color: var(--orange); }
  .score.good { background: var(--green-soft); color: var(--green-dark); }
  .info { flex: 1; }
  .info strong { display: block; font-weight: 900; }
  .info small { color: var(--muted); font-weight: 700; }
  .chev { font-size: 1.6rem; color: var(--muted); }
</style>
