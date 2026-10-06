// Sanity checks for the question bank and the daily quiz generator: `npm run validate`
import { QUESTIONS, CASES, caseQuestions } from '../src/lib/questions';
import { ALL_TASKS, TASKS } from '../src/lib/blueprint';
import type { Graphic, Question } from '../src/lib/types';

const errors: string[] = [];
const fail = (q: Question, msg: string) => errors.push(`${q.id}: ${msg}`);

function zones(g: Graphic): string[] {
  switch (g.kind) {
    case 'burndown': return g.actual.map((v, i) => (v == null ? '' : `d${i}`)).filter(Boolean);
    case 'scurve': return g.ev.map((_, i) => `p${i + 1}`);
    case 'kanban': return g.columns.map((c) => c.id);
    case 'riskMatrix': return g.risks.map((r) => r.id);
    case 'bars': return g.values.map((_, i) => `b${i}`);
    case 'table': return g.rows.map((_, i) => `r${i}`);
    case 'powerInterest': return ['manage', 'satisfy', 'inform', 'monitor'];
  }
}

const ids = new Set<string>();
for (const q of QUESTIONS) {
  if (ids.has(q.id)) fail(q, 'duplicate id');
  ids.add(q.id);
  if (q.task < 1 || q.task > TASKS[q.domain].length) fail(q, 'task out of range');
  switch (q.type) {
    case 'single':
      if (q.answer < 0 || q.answer >= q.options.length) fail(q, 'answer index out of range');
      if (new Set(q.options).size !== q.options.length) fail(q, 'duplicate options');
      break;
    case 'multi':
      if (q.answer.some((a) => a < 0 || a >= q.options.length)) fail(q, 'answer index out of range');
      if (q.answer.length < 2) fail(q, 'multi needs 2+ answers');
      if (!new RegExp(['', '', 'TWO', 'THREE'][q.answer.length]).test(q.stem)) fail(q, 'stem does not state how many to select');
      break;
    case 'match':
      if (q.left.length !== q.right.length) fail(q, 'left/right length mismatch');
      break;
    case 'dropdown': {
      const n = (q.text.match(/\{\d+\}/g) ?? []).length;
      if (n !== q.blanks.length) fail(q, `placeholders ${n} != blanks ${q.blanks.length}`);
      q.blanks.forEach((b, i) => b.answer >= b.options.length && fail(q, `blank ${i} answer out of range`));
      break;
    }
    case 'hotspot':
      if (!zones(q.graphic).includes(q.answer)) fail(q, `hotspot answer ${q.answer} not a zone`);
      break;
  }
}
for (const c of CASES) if (caseQuestions(c.id).length < 2) errors.push(`${c.id}: fewer than 2 questions`);

// Coverage report
const count = (f: (q: Question) => boolean) => QUESTIONS.filter(f).length;
console.log(`Questions: ${QUESTIONS.length} (cases: ${CASES.length})`);
for (const d of ['people', 'process', 'business'] as const) console.log(`  ${d}: ${count((q) => q.domain === d)}`);
for (const a of ['predictive', 'agile', 'hybrid'] as const) console.log(`  ${a}: ${count((q) => q.approach === a)}`);
for (const t of ['single', 'multi', 'match', 'dropdown', 'hotspot'] as const) console.log(`  ${t}: ${count((q) => q.type === t)}`);
for (const n of [1, 2, 3] as const) console.log(`  difficulty ${n}: ${count((q) => q.difficulty === n)}`);
const thin = ALL_TASKS.filter((t) => count((q) => q.domain === t.domain && q.task === t.task) < 6);
if (thin.length) console.log('  tasks with < 6 questions:', thin.map((t) => `${t.domain}:${t.task}`).join(', '));

// Simulate 30 days of daily quizzes
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {} };
// Svelte runes are compile-time; outside the compiler $state is just the initial value
(globalThis as any).$state = <T>(v: T) => v;
const { app, recordSession } = await import('../src/lib/store.svelte');
const { buildQuiz } = await import('../src/lib/quizgen');
const RealDate = Date;
const agg = { people: 0, process: 0, business: 0, predictive: 0, total: 0, cases: 0, repeats: 0 };
const seen = new Set<string>();
for (let day = 0; day < 30; day++) {
  const base = new RealDate(2026, 9, 1 + day, 9).getTime();
  (globalThis as any).Date = class extends RealDate { constructor(...a: any[]) { super(...(a.length ? a : [base]) as []); } static now() { return base; } };
  const quiz = buildQuiz(app, 'daily');
  if (quiz.length !== 15) errors.push(`day ${day}: quiz has ${quiz.length} questions`);
  if (new Set(quiz.map((q) => q.id)).size !== quiz.length) errors.push(`day ${day}: duplicate question in quiz`);
  for (const q of quiz) {
    agg[q.domain]++;
    if (q.approach === 'predictive') agg.predictive++;
    if (seen.has(q.id)) agg.repeats++;
    seen.add(q.id);
  }
  agg.total += quiz.length;
  agg.cases += quiz.some((q) => q.caseId) ? 1 : 0;
  // A simulated learner who misses process questions more often
  recordSession('daily', quiz.map((q) => ({ qid: q.id, correct: Math.random() > (q.domain === 'process' ? 0.5 : 0.2), ms: 30000, response: { type: 'single', choice: 0 } })), base, 100, 3);
}
(globalThis as any).Date = RealDate;
const pct = (n: number) => `${Math.round((n / agg.total) * 100)}%`;
console.log(`\n30-day simulation: people ${pct(agg.people)}, process ${pct(agg.process)}, business ${pct(agg.business)}, predictive ${pct(agg.predictive)}, days with case set ${agg.cases}/30, repeats ${agg.repeats}/${agg.total}, unique seen ${seen.size}/${QUESTIONS.length}`);

if (errors.length) {
  console.error('\nERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nAll checks passed');
