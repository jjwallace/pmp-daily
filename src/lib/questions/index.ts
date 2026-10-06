import type { CaseStudy, Question } from '../types';
import { PEOPLE } from './people';
import { PROCESS } from './process';
import { BUSINESS } from './business';
import { CASES, CASE_QUESTIONS } from './cases';

export const QUESTIONS: Question[] = [...PEOPLE, ...PROCESS, ...BUSINESS, ...CASE_QUESTIONS];
export const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
export const CASE_BY_ID = new Map<string, CaseStudy>(CASES.map((c) => [c.id, c]));
export const CASE_IDS = CASES.map((c) => c.id);
export const caseQuestions = (caseId: string) => CASE_QUESTIONS.filter((q) => q.caseId === caseId);
export { CASES };
