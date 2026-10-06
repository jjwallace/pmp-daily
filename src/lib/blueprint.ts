import type { Domain } from './types';

/** PMP Examination Content Outline, July 2026 */
export const DOMAINS: { id: Domain; name: string; weight: number; color: string }[] = [
  { id: 'people', name: 'People', weight: 0.33, color: '#ce82ff' },
  { id: 'process', name: 'Process', weight: 0.41, color: '#1cb0f6' },
  { id: 'business', name: 'Business Environment', weight: 0.26, color: '#ff9600' },
];

export const TASKS: Record<Domain, string[]> = {
  people: [
    'Develop a common vision',
    'Manage conflicts',
    'Lead the project team',
    'Engage stakeholders',
    'Align stakeholder expectations',
    'Manage stakeholder expectations',
    'Help ensure knowledge transfer',
    'Plan and manage communication',
  ],
  process: [
    'Develop an integrated project management plan and plan delivery',
    'Develop and manage project scope',
    'Help ensure value-based delivery',
    'Plan and manage resources',
    'Plan and manage procurement',
    'Plan and manage finance',
    'Plan and optimize quality of products/deliverables',
    'Plan and manage schedule',
    'Evaluate project status',
    'Manage project closure',
  ],
  business: [
    'Define and establish project governance',
    'Plan and manage project compliance',
    'Manage and control changes',
    'Remove impediments and manage issues',
    'Plan and manage risk',
    'Continuous improvement',
    'Support organizational change',
    'Evaluate external business environment changes',
  ],
};

export const domainName = (d: Domain) => DOMAINS.find((x) => x.id === d)!.name;
export const domainColor = (d: Domain) => DOMAINS.find((x) => x.id === d)!.color;
export const taskKey = (d: Domain, t: number) => `${d}:${t}`;
export const taskName = (d: Domain, t: number) => TASKS[d][t - 1];

export const ALL_TASKS = DOMAINS.flatMap((d) => TASKS[d.id].map((_, i) => ({ domain: d.id, task: i + 1 })));

/** 15 questions split by ECO weights: 33/41/26 */
export const DAILY_SIZE = 15;
export const DAILY_QUOTA: Record<Domain, number> = { people: 5, process: 6, business: 4 };
/** ECO: ~40% predictive, ~60% agile + hybrid */
export const PREDICTIVE_SHARE = 0.4;

export type Band = 'above' | 'target' | 'below' | 'needs' | 'none';
export const BANDS: Record<Band, { label: string; color: string }> = {
  above: { label: 'Above Target', color: '#58cc02' },
  target: { label: 'Target', color: '#1cb0f6' },
  below: { label: 'Below Target', color: '#ff9600' },
  needs: { label: 'Needs Improvement', color: '#ff4b4b' },
  none: { label: 'Not enough data', color: '#afafaf' },
};
