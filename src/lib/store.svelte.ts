import type { AppState, Attempt, QStat, Session, SessionMode } from './types';

const KEY = 'pmp-daily:v1';
/** Leitner review intervals in days, indexed by box */
const INTERVALS = [1, 2, 4, 8, 16, 32];

export const today = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
};

const fresh = (): AppState => ({
  version: 1,
  sessions: [],
  qstats: {},
  xp: 0,
  settings: { sound: true, haptics: true, examDate: null },
});

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as AppState;
    return { ...fresh(), ...parsed, settings: { ...fresh().settings, ...parsed.settings } };
  } catch {
    return fresh();
  }
}

export const app = $state<AppState>(load());

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(app));
  } catch {
    /* storage unavailable; state still lives in memory */
  }
}

export function recordSession(mode: SessionMode, attempts: Attempt[], startedAt: number, xp: number, bestCombo: number): Session {
  const date = today();
  const session: Session = {
    id: `${Date.now().toString(36)}`,
    date,
    startedAt,
    endedAt: Date.now(),
    mode,
    attempts,
    xp,
    bestCombo,
  };
  app.sessions.push(session);
  app.xp += xp;
  for (const a of attempts) {
    const s: QStat = app.qstats[a.qid] ?? { seen: 0, correct: 0, lastSeen: date, box: 0, due: date };
    s.seen += 1;
    s.lastSeen = date;
    if (a.correct) {
      s.correct += 1;
      s.box = Math.min(s.box + 1, INTERVALS.length - 1);
    } else {
      s.box = 0;
    }
    s.due = addDays(date, INTERVALS[s.box]);
    app.qstats[a.qid] = s;
  }
  persist();
  return session;
}

/** Consecutive days (ending today or yesterday) with a completed daily quiz */
export function streak(): { current: number; best: number; doneToday: boolean } {
  const days = new Set(app.sessions.filter((s) => s.mode === 'daily').map((s) => s.date));
  const t = today();
  const doneToday = days.has(t);
  let current = 0;
  let cursor = doneToday ? t : addDays(t, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best, doneToday };
}

export function exportData(): string {
  return JSON.stringify(app, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as AppState;
  if (parsed.version !== 1 || !Array.isArray(parsed.sessions)) throw new Error('Not a PMP Daily backup');
  Object.assign(app, fresh(), parsed);
  persist();
}

export function resetAll() {
  Object.assign(app, fresh());
  persist();
}
