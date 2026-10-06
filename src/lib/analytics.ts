import { ALL_TASKS, DOMAINS, taskKey, type Band } from './blueprint';
import { BY_ID } from './questions';
import type { Approach, Domain, QType, Session } from './types';

/** Older answers fade: each newer attempt on the same task multiplies older weights by this */
const DECAY = 0.85;
/** Pseudo-counts so a couple of answers don't swing mastery to 0% or 100% */
const PRIOR_RIGHT = 1;
const PRIOR_WRONG = 1;
const DIFF_WEIGHT = { 1: 0.8, 2: 1, 3: 1.25 } as const;
export const MIN_FOR_BAND = 3;

export interface Mastery {
  /** 0..1 recency- and difficulty-weighted accuracy */
  score: number;
  attempts: number;
  correct: number;
  band: Band;
}

export function bandFor(score: number, attempts: number): Band {
  if (attempts < MIN_FOR_BAND) return 'none';
  if (score >= 0.8) return 'above';
  if (score >= 0.68) return 'target';
  if (score >= 0.55) return 'below';
  return 'needs';
}

function accumulate(sessions: Session[], keyOf: (qid: string) => string | null): Map<string, Mastery> {
  const acc = new Map<string, { w: number; wr: number; n: number; c: number }>();
  for (const s of sessions) {
    for (const a of s.attempts) {
      const q = BY_ID.get(a.qid);
      if (!q) continue;
      const k = keyOf(a.qid);
      if (!k) continue;
      const e = acc.get(k) ?? { w: 0, wr: 0, n: 0, c: 0 };
      e.w *= DECAY;
      e.wr *= DECAY;
      const w = DIFF_WEIGHT[q.difficulty];
      e.w += w;
      if (a.correct) e.wr += w;
      e.n += 1;
      if (a.correct) e.c += 1;
      acc.set(k, e);
    }
  }
  const out = new Map<string, Mastery>();
  for (const [k, e] of acc) {
    const score = (e.wr + PRIOR_RIGHT) / (e.w + PRIOR_RIGHT + PRIOR_WRONG);
    out.set(k, { score, attempts: e.n, correct: e.c, band: bandFor(score, e.n) });
  }
  return out;
}

const EMPTY: Mastery = { score: 0.5, attempts: 0, correct: 0, band: 'none' };

export function taskMastery(sessions: Session[]) {
  const m = accumulate(sessions, (id) => {
    const q = BY_ID.get(id)!;
    return taskKey(q.domain, q.task);
  });
  return ALL_TASKS.map((t) => ({ ...t, key: taskKey(t.domain, t.task), ...(m.get(taskKey(t.domain, t.task)) ?? EMPTY) }));
}

export function domainMastery(sessions: Session[]): Record<Domain, Mastery> {
  const m = accumulate(sessions, (id) => BY_ID.get(id)!.domain);
  return Object.fromEntries(DOMAINS.map((d) => [d.id, m.get(d.id) ?? EMPTY])) as Record<Domain, Mastery>;
}

export function approachMastery(sessions: Session[]): Record<Approach, Mastery> {
  const m = accumulate(sessions, (id) => BY_ID.get(id)!.approach);
  return { predictive: m.get('predictive') ?? EMPTY, agile: m.get('agile') ?? EMPTY, hybrid: m.get('hybrid') ?? EMPTY };
}

export function typeMastery(sessions: Session[]): Record<QType, Mastery> {
  const m = accumulate(sessions, (id) => BY_ID.get(id)!.type);
  const types: QType[] = ['single', 'multi', 'match', 'dropdown', 'hotspot'];
  return Object.fromEntries(types.map((t) => [t, m.get(t) ?? EMPTY])) as Record<QType, Mastery>;
}

/**
 * Exam readiness: domain mastery weighted by ECO domain weights, discounted by how much of the
 * 26-task blueprint has actually been practiced.
 */
export function readiness(sessions: Session[]) {
  const tasks = taskMastery(sessions);
  const coverage = tasks.filter((t) => t.attempts > 0).length / tasks.length;
  const confident = tasks.filter((t) => t.attempts >= MIN_FOR_BAND).length / tasks.length;
  const dm = domainMastery(sessions);
  const weighted = DOMAINS.reduce((sum, d) => sum + d.weight * dm[d.id].score, 0);
  const totalAttempts = tasks.reduce((s, t) => s + t.attempts, 0);
  return {
    score: weighted,
    coverage,
    band: bandFor(weighted, confident >= 0.5 ? totalAttempts : 0),
  };
}

/** Tasks ordered weakest first; unpracticed tasks rank as moderately weak so they get covered */
export function weakest(sessions: Session[], n = 5) {
  return taskMastery(sessions)
    .map((t) => ({ ...t, need: t.attempts === 0 ? 0.55 : 1 - t.score }))
    .sort((a, b) => b.need - a.need)
    .slice(0, n);
}

export const sessionScore = (s: Session) => (s.attempts.length ? s.attempts.filter((a) => a.correct).length / s.attempts.length : 0);
