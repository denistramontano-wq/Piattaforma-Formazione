/**
 * Soglie di livello per XP cumulativo (docs/05-gamification.md §5.2).
 * Valori statici e non configurabili da admin: solo i punti per azione (XpRule)
 * e i badge sono data-driven, per restare nello scope descritto nel capitolo 5.
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Novizio', minXp: 0 },
  { level: 2, name: 'Apprendista', minXp: 100 },
  { level: 3, name: 'Esperto', minXp: 300 },
  { level: 4, name: 'Maestro', minXp: 700 },
  { level: 5, name: 'Leggenda', minXp: 1500 },
] as const;

export interface LevelInfo {
  level: number;
  name: string;
  minXp: number;
  nextLevelXp: number | null;
  progressPct: number;
}

export function levelForXp(totalXp: number): LevelInfo {
  let currentIndex = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i].minXp) currentIndex = i;
    else break;
  }
  const current = LEVEL_THRESHOLDS[currentIndex];
  const next = LEVEL_THRESHOLDS[currentIndex + 1] ?? null;
  const progressPct = next
    ? Math.round(((totalXp - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;
  return {
    level: current.level,
    name: current.name,
    minXp: current.minXp,
    nextLevelXp: next?.minXp ?? null,
    progressPct,
  };
}
