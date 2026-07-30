import type { ContentStatus } from '@/lib/types';

const STYLES: Record<ContentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  SCHEDULED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  ARCHIVED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const LABELS: Record<ContentStatus, string> = {
  DRAFT: 'Bozza',
  SCHEDULED: 'Programmato',
  PUBLISHED: 'Pubblicato',
  ARCHIVED: 'Archiviato',
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`badge ${STYLES[status]}`}>{LABELS[status]}</span>;
}
