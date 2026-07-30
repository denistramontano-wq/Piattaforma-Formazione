'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function PuzzleGame({ gameId, sentence }: { gameId: string; sentence: string }) {
  // Mescolare durante il render (eseguito anche in SSR) produrrebbe un ordine diverso tra
  // server e client: lo shuffle vero avviene solo dopo il mount, lato client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const words = useMemo(() => sentence.split(' '), [sentence]);
  const orderedPieces = useMemo(
    () => words.map((w, i) => ({ id: `${i}-${w}`, word: w, originalIndex: i })),
    [words],
  );
  const pieces = useMemo(
    () => (mounted ? shuffle(orderedPieces) : orderedPieces),
    [mounted, orderedPieces],
  );
  const [available, setAvailable] = useState(pieces);
  useEffect(() => setAvailable(pieces), [pieces]);
  const [chosen, setChosen] = useState<typeof pieces>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const startedAt = useState(() => Date.now())[0];

  function choose(piece: (typeof pieces)[number]) {
    const nextChosen = [...chosen, piece];
    setChosen(nextChosen);
    setAvailable(available.filter((p) => p.id !== piece.id));

    if (nextChosen.length === words.length) {
      const correctCount = nextChosen.filter((p, i) => p.originalIndex === i).length;
      const finalScore = Math.round((correctCount / words.length) * 100);
      setScore(finalScore);
      setFinished(true);
      api.post(`/games/${gameId}/sessions`, {
        score: finalScore,
        durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      });
    }
  }

  function reset() {
    setAvailable(pieces);
    setChosen([]);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">🧩</p>
        <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {score === 100 ? 'Frase ricomposta correttamente!' : `Punteggio: ${score}%`}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">&laquo;{sentence}&raquo;</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Clicca le parole nell&apos;ordine corretto per ricomporre la frase.
      </p>
      <div className="card flex min-h-16 flex-wrap gap-2 p-4">
        {chosen.length === 0 && <span className="text-sm text-slate-400">La tua frase apparirà qui…</span>}
        {chosen.map((p) => (
          <span
            key={p.id}
            className="rounded bg-accent-50 px-2 py-1 text-sm font-medium text-accent-700 dark:bg-accent-500/10 dark:text-accent-400"
          >
            {p.word}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => choose(p)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-accent-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {p.word}
          </button>
        ))}
      </div>
      {chosen.length > 0 && (
        <button type="button" onClick={reset} className="btn-secondary w-fit">
          Ricomincia
        </button>
      )}
    </div>
  );
}
