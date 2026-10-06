import { DAILY_QUOTA, DAILY_SIZE, PREDICTIVE_SHARE, taskKey } from './blueprint';
import { taskMastery } from './analytics';
import { CASE_IDS, QUESTIONS, caseQuestions } from './questions';
import type { AppState, Domain, Question, SessionMode } from './types';
import { today } from './store.svelte';

/** mulberry32: small seeded PRNG so the daily quiz is stable for the whole day */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedPick<T>(items: T[], weight: (t: T) => number, rand: () => number): T | undefined {
  const total = items.reduce((s, t) => s + weight(t), 0);
  if (total <= 0) return items[0];
  let r = rand() * total;
  for (const t of items) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return items[items.length - 1];
}

/**
 * Builds a quiz:
 *  1. One linked case-study set (2–3 questions), least-recently seen first
 *  2. Up to 3 missed questions due for spaced review
 *  3. The rest filled to the ECO domain quota (5/6/4); tasks drawn with weight toward weak areas,
 *     unseen questions preferred, approach steered toward ~40% predictive
 *  4. Ordered easy → hard so the session ramps like the real exam's mix, case set kept together
 */
export function buildQuiz(state: AppState, mode: SessionMode, opts: { focusTasks?: string[] } = {}): Question[] {
  const dayCount = state.sessions.filter((s) => s.date === today()).length;
  const rand = rng(hash(`${today()}:${mode}:${mode === 'daily' ? 0 : dayCount}`));
  const size = mode === 'drill' ? 10 : DAILY_SIZE;
  const stats = state.qstats;
  const mastery = new Map(taskMastery(state.sessions).map((t) => [t.key, t]));
  const t = today();

  const picked: Question[] = [];
  const used = new Set<string>();
  const take = (q: Question) => {
    picked.push(q);
    used.add(q.id);
  };

  // Freshness: unseen first, then not due, then by how long ago it was seen
  const freshness = (q: Question) => {
    const s = stats[q.id];
    if (!s) return 3;
    if (s.due <= t && s.correct < s.seen) return 2.5;
    const daysAgo = (Date.parse(t) - Date.parse(s.lastSeen)) / 86400000;
    return Math.min(2, 0.2 + daysAgo / 7);
  };

  // 1. Case set
  if (mode !== 'drill') {
    const lastSeenCase = (id: string) => {
      const seen = caseQuestions(id).map((q) => stats[q.id]?.lastSeen ?? '');
      return seen.sort().pop() ?? '';
    };
    const ordered = shuffle(CASE_IDS, rand).sort((a, b) => lastSeenCase(a).localeCompare(lastSeenCase(b)));
    const caseId = ordered[0];
    if (caseId) caseQuestions(caseId).forEach(take);
  }

  const focus = opts.focusTasks?.length ? new Set(opts.focusTasks) : null;
  const pool = QUESTIONS.filter((q) => !q.caseId && (!focus || focus.has(taskKey(q.domain, q.task))));

  // 2. Spaced review of missed questions
  const due = shuffle(
    pool.filter((q) => {
      const s = stats[q.id];
      return s && s.due <= t && s.box === 0;
    }),
    rand,
  ).slice(0, mode === 'drill' ? 4 : 3);
  due.forEach(take);

  // 3. Fill by domain quota
  const domainCount = (d: Domain) => picked.filter((q) => q.domain === d).length;
  const predictiveCount = () => picked.filter((q) => q.approach === 'predictive').length;
  const quota: Record<Domain, number> = focus
    ? { people: size, process: size, business: size }
    : { ...DAILY_QUOTA };

  let guard = 0;
  while (picked.length < size && guard++ < 500) {
    const domains = (['people', 'process', 'business'] as Domain[]).filter((d) => domainCount(d) < quota[d]);
    const d = domains.length ? weightedPick(domains, (x) => quota[x] - domainCount(x), rand)! : (['people', 'process', 'business'] as Domain[])[Math.floor(rand() * 3)];
    const candidates = pool.filter((q) => q.domain === d && !used.has(q.id));
    if (!candidates.length) {
      quota[d] = domainCount(d);
      if (!pool.some((q) => !used.has(q.id))) break;
      continue;
    }
    // Weak tasks get more weight; unpracticed tasks get a moderate boost
    const taskWeight = (q: Question) => {
      const m = mastery.get(taskKey(q.domain, q.task));
      const need = !m || m.attempts === 0 ? 0.6 : 1 - m.score;
      return 0.35 + need * 1.6;
    };
    const wantPredictive = predictiveCount() < Math.round(size * PREDICTIVE_SHARE) * (picked.length / size + 0.15);
    const approachWeight = (q: Question) => ((q.approach === 'predictive') === wantPredictive ? 1.4 : 0.8);
    const q = weightedPick(candidates, (q) => taskWeight(q) * freshness(q) * approachWeight(q), rand)!;
    take(q);
  }

  // 4. Order: singles by difficulty, case set inserted as a block around the 60% mark
  const caseBlock = picked.filter((q) => q.caseId);
  const rest = picked
    .filter((q) => !q.caseId)
    .map((q) => ({ q, k: q.difficulty + rand() * 1.2 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.q);
  const at = Math.round(rest.length * 0.6);
  return [...rest.slice(0, at), ...caseBlock, ...rest.slice(at)];
}
