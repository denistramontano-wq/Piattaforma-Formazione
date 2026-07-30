'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

interface Pair {
  emoji: string;
  label: string;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function ImageMatchGame({ gameId, pairs }: { gameId: string; pairs: Pair[] }) {
  // Mescolare durante il render (eseguito anche in SSR) produrrebbe un ordine diverso tra
  // server e client: lo shuffle vero avviene solo dopo il mount, lato client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ordered = useMemo(() => pairs.map((p, i) => ({ ...p, id: i })), [pairs]);
  const symbols = useMemo(() => (mounted ? shuffle(ordered) : ordered), [mounted, ordered]);
  const labels = useMemo(() => (mounted ? shuffle(ordered) : ordered), [mounted, ordered]);

  const [selectedSymbol, setSelectedSymbol] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const startedAt = useState(() => Date.now())[0];

  const finished = matched.size === pairs.length;

  function pickSymbol(id: number) {
    if (matched.has(id)) return;
    setSelectedSymbol(id);
  }

  function pickLabel(id: number) {
    if (selectedSymbol === null || matched.has(id)) return;
    setAttempts((a) => a + 1);
    if (selectedSymbol === id) {
      const next = new Set(matched).add(id);
      setMatched(next);
      setSelectedSymbol(null);
      if (next.size === pairs.length) {
        const score = Math.max(0, Math.round(100 - (attempts + 1 - pairs.length) * 10));
        api.post(`/games/${gameId}/sessions`, {
          score,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        });
      }
    } else {
      setWrongFlash(id);
      setTimeout(() => setWrongFlash(null), 500);
      setSelectedSymbol(null);
    }
  }

  if (finished) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">🖼️</p>
        <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Completato in {attempts} tentativi!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Seleziona un simbolo, poi il significato corrispondente. Tentativi: {attempts}
      </p>
      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-2">
          {symbols.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={matched.has(s.id)}
              onClick={() => pickSymbol(s.id)}
              className={`card flex h-16 items-center justify-center text-3xl transition ${
                matched.has(s.id)
                  ? 'border-emerald-400 bg-emerald-50 opacity-60 dark:bg-emerald-500/10'
                  : selectedSymbol === s.id
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10'
                    : ''
              }`}
            >
              {s.emoji}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {labels.map((l) => (
            <button
              key={l.id}
              type="button"
              disabled={matched.has(l.id)}
              onClick={() => pickLabel(l.id)}
              className={`card flex h-16 items-center justify-center px-2 text-center text-sm font-medium transition ${
                matched.has(l.id)
                  ? 'border-emerald-400 bg-emerald-50 opacity-60 dark:bg-emerald-500/10'
                  : wrongFlash === l.id
                    ? 'border-red-400 bg-red-50 dark:bg-red-500/10'
                    : ''
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
