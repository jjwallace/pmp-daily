import type { Question, Response } from './types';

export function isCorrect(q: Question, r: Response): boolean {
  switch (q.type) {
    case 'single':
      return r.type === 'single' && r.choice === q.answer;
    case 'multi': {
      if (r.type !== 'multi') return false;
      const a = [...q.answer].sort();
      const b = [...r.choices].sort();
      return a.length === b.length && a.every((v, i) => v === b[i]);
    }
    case 'match':
      return r.type === 'match' && r.pairs.length === q.left.length && r.pairs.every((rightIdx, leftIdx) => rightIdx === leftIdx);
    case 'dropdown':
      return r.type === 'dropdown' && q.blanks.every((b, i) => r.choices[i] === b.answer);
    case 'hotspot':
      return r.type === 'hotspot' && r.zone === q.answer;
  }
}

/** Short human-readable form of the correct answer, used in feedback and review */
export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case 'single':
      return q.options[q.answer];
    case 'multi':
      return q.answer.map((i) => q.options[i]).join(' + ');
    case 'match':
      return q.left.map((l, i) => `${l} → ${q.right[i]}`).join('\n');
    case 'dropdown':
      return q.blanks.map((b) => b.options[b.answer]).join(', ');
    case 'hotspot':
      return zoneLabel(q, q.answer);
  }
}

export function responseText(q: Question, r: Response): string {
  switch (r.type) {
    case 'single':
      return q.type === 'single' ? q.options[r.choice] ?? '—' : '—';
    case 'multi':
      return q.type === 'multi' ? r.choices.map((i) => q.options[i]).join(' + ') || '—' : '—';
    case 'match':
      return q.type === 'match' ? q.left.map((l, i) => `${l} → ${q.right[r.pairs[i]] ?? '?'}`).join('\n') : '—';
    case 'dropdown':
      return q.type === 'dropdown' ? q.blanks.map((b, i) => b.options[r.choices[i]] ?? '?').join(', ') : '—';
    case 'hotspot':
      return zoneLabel(q, r.zone);
  }
}

export function zoneLabel(q: Question, zone: string): string {
  const g = q.graphic;
  if (!g) return zone;
  switch (g.kind) {
    case 'kanban':
      return g.columns.find((c) => c.id === zone)?.name ?? zone;
    case 'riskMatrix':
      return g.risks.find((r) => r.id === zone)?.label ?? zone;
    case 'bars':
      return g.labels[Number(zone.slice(1))] ?? zone;
    case 'burndown':
      return `Point ${zone.slice(1)}`;
    case 'scurve':
      return `Period ${zone.slice(1)}`;
    case 'table':
      return `Row ${Number(zone.slice(1)) + 1}`;
    case 'powerInterest':
      return { manage: 'Manage closely', satisfy: 'Keep satisfied', inform: 'Keep informed', monitor: 'Monitor' }[zone] ?? zone;
  }
}
