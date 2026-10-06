export type Domain = 'people' | 'process' | 'business';
export type Approach = 'predictive' | 'agile' | 'hybrid';
export type Difficulty = 1 | 2 | 3;
export type QType = 'single' | 'multi' | 'match' | 'dropdown' | 'hotspot';

/** Charts and diagrams drawn as SVG. Hotspot answers refer to the zone ids each kind exposes. */
export type Graphic =
  /** zones: "d{day}", day 0 = start */
  | { kind: 'burndown'; title?: string; days: number; total: number; actual: (number | null)[]; unit?: string }
  /** zones: "p{period}", 1-based */
  | { kind: 'scurve'; title?: string; pv: number[]; ev: number[]; ac: number[] }
  /** zones: column id */
  | { kind: 'kanban'; title?: string; columns: { id: string; name: string; wip?: number; cards: number }[] }
  /** zones: risk id */
  | { kind: 'riskMatrix'; title?: string; risks: { id: string; label: string; p: number; i: number }[] }
  /** zones: "b{index}", 0-based */
  | { kind: 'bars'; title?: string; labels: string[]; values: number[]; unit?: string; line?: number; lineLabel?: string }
  /** zones: "r{rowIndex}" */
  | { kind: 'table'; title?: string; headers: string[]; rows: (string | number)[][] }
  /** zones: quadrant id: "manage" | "satisfy" | "inform" | "monitor" */
  | { kind: 'powerInterest'; title?: string; items: { id: string; label: string; power: number; interest: number }[] };

interface Base {
  id: string;
  domain: Domain;
  /** 1-based task number within the domain, per the July 2026 ECO */
  task: number;
  approach: Approach;
  difficulty: Difficulty;
  stem: string;
  graphic?: Graphic;
  explanation: string;
  /** Linked case-study set this question belongs to */
  caseId?: string;
}

export interface SingleQ extends Base { type: 'single'; options: string[]; answer: number }
export interface MultiQ extends Base { type: 'multi'; options: string[]; answer: number[] }
/** left[i] pairs with right[i]; the UI shuffles the right column */
export interface MatchQ extends Base { type: 'match'; left: string[]; right: string[] }
/** `text` contains {0}, {1}... placeholders, one per blank */
export interface DropdownQ extends Base { type: 'dropdown'; text: string; blanks: { options: string[]; answer: number }[] }
export interface HotspotQ extends Base { type: 'hotspot'; graphic: Graphic; answer: string }

export type Question = SingleQ | MultiQ | MatchQ | DropdownQ | HotspotQ;

export interface CaseStudy {
  id: string;
  title: string;
  scenario: string;
  graphic?: Graphic;
}

/** What the user submitted, by question type */
export type Response =
  | { type: 'single'; choice: number }
  | { type: 'multi'; choices: number[] }
  | { type: 'match'; pairs: number[] } // pairs[leftIndex] = rightIndex (original index)
  | { type: 'dropdown'; choices: number[] }
  | { type: 'hotspot'; zone: string };

export interface Attempt {
  qid: string;
  correct: boolean;
  ms: number;
  response: Response;
}

export type SessionMode = 'daily' | 'practice' | 'drill';

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD local
  startedAt: number;
  endedAt: number;
  mode: SessionMode;
  attempts: Attempt[];
  xp: number;
  bestCombo: number;
}

export interface QStat {
  seen: number;
  correct: number;
  lastSeen: string;
  /** Leitner box 0..5 */
  box: number;
  due: string;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  examDate: string | null;
}

export interface AppState {
  version: 1;
  sessions: Session[];
  qstats: Record<string, QStat>;
  xp: number;
  settings: Settings;
}
