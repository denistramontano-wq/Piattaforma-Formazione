'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';

interface Pair {
  a: string;
  b: string;
}

interface Tile {
  key: string;
  label: string;
  pairId: number;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function MemoryGame({ gameId, pairs }: { gameId: string; pairs: Pair[] }) {
  const tiles = useMemo<Tile[]>(
    () =>
      shuffle(
        pairs.flatMap((p, i) => [
          { key: `a-${i}`, label: p.a, pairId: i },
          { key: `b-${i}`, label: p.b, pairId: i },
        ]),
      ),
    [pairs],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const startedAt = useState(() => Date.now())[0];

  const finished = matched.size === pairs.length;

  function handleClick(tile: Tile) {
    if (selected.includes(tile.key) || matched.has(tile.pairId) || selected.length === 2) return;
    const next = [...selected, tile.key];
    setSelected(next);
    if (next.length === 2) {
      setAttempts((a) => a + 1);
      const [firstKey, secondKey] = next;
      const first = tiles.find((t) => t.key === firstKey)!;
      const second = tiles.find((t) => t.key === secondKey)!;
      if (first.pairId === second.pairId) {
        const newMatched = new Set(matched).add(first.pairId);
        setMatched(newMatched);
        setSelected([]);
        if (newMatched.size === pairs.length) {
          const score = Math.max(0, Math.round(100 - (attempts + 1 - pairs.length) * 5));
          api.post(`/games/${gameId}/sessions`, {
            score,
            durationSeconds: Math.round((Date.now() - startedAt) / 1000),
          });
        }
      } else {
        setTimeout(() => setSelected([]), 700);
      }
    }
  }

  if (finished) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">🎉</p>
        <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Completato in {attempts} tentativi!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">Tentativi: {attempts}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => {
          const isMatched = matched.has(tile.pairId);
          const isSelected = selected.includes(tile.key);
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => handleClick(tile)}
              disabled={isMatched}
              className={`card flex h-24 w-32 items-center justify-center p-2 text-center text-sm font-medium transition ${
                isMatched
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : isSelected
                    ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10'
                    : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {tile.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
