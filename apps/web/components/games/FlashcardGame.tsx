'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Card {
  front: string;
  back: string;
}

export function FlashcardGame({ gameId, cards }: { gameId: string; cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAt = useState(() => Date.now())[0];

  function next(isKnown: boolean) {
    if (isKnown) setKnown((k) => k + 1);
    if (index + 1 >= cards.length) {
      setFinished(true);
      const score = Math.round(((isKnown ? known + 1 : known) / cards.length) * 100);
      api.post(`/games/${gameId}/sessions`, {
        score,
        durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      });
      return;
    }
    setIndex((i) => i + 1);
    setFlipped(false);
  }

  if (finished) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">🎉</p>
        <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Hai ripassato {known}/{cards.length} carte correttamente
        </p>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Carta {index + 1} di {cards.length}
      </p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="card flex h-56 w-full max-w-md items-center justify-center p-6 text-center text-lg font-medium text-slate-800 shadow-md transition hover:shadow-lg dark:text-slate-100"
      >
        {flipped ? card.back : card.front}
      </button>
      <p className="text-xs text-slate-400">Clicca sulla carta per girarla</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => next(false)} className="btn-secondary">
          Da ripassare
        </button>
        <button type="button" onClick={() => next(true)} className="btn-primary">
          La sapevo ✅
        </button>
      </div>
    </div>
  );
}
