import type { Level } from '@/lib/types';

const STYLES: Record<Level, string> = {
  BASE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  INTERMEDIO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  AVANZATO: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const LABELS: Record<Level, string> = {
  BASE: 'Base',
  INTERMEDIO: 'Intermedio',
  AVANZATO: 'Avanzato',
};

export function LevelBadge({ level }: { level: Level }) {
  return <span className={`badge ${STYLES[level]}`}>{LABELS[level]}</span>;
}
