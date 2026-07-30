'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function FindErrorGame({
  gameId,
  tokens,
  errorIndexes,
  explanations,
}: {
  gameId: string;
  tokens: string[];
  errorIndexes: number[];
  explanations: Record<string, string>;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const startedAt = useState(() => Date.now())[0];

  function toggle(i: number) {
    if (submitted) return;
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  function submit() {
    const errorSet = new Set(errorIndexes);
    const correctlyFound = [...selected].filter((i) => errorSet.has(i)).length;
    const falsePositives = [...selected].filter((i) => !errorSet.has(i)).length;
    const finalScore = Math.max(
      0,
      Math.round((correctlyFound / errorIndexes.length) * 100 - falsePositives * 10),
    );
    setScore(finalScore);
    setSubmitted(true);
    api.post(`/games/${gameId}/sessions`, {
      score: finalScore,
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
    });
  }

  if (submitted) {
    const errorSet = new Set(errorIndexes);
    return (
      <div className="flex flex-col gap-4">
        <div className="card p-8 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Punteggio: {score}%</p>
        </div>
        <div className="card p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Spiegazioni</p>
          <ul className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            {errorIndexes.map((i) => (
              <li key={i}>
                <strong>&laquo;{tokens[i]}&raquo;</strong>: {explanations[String(i)]}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-400">
          Parole errate evidenziate in verde, tue selezioni sbagliate in rosso.
        </p>
        <p className="flex flex-wrap gap-1 text-sm leading-relaxed">
          {tokens.map((t, i) => (
            <span
              key={i}
              className={
                errorSet.has(i)
                  ? 'rounded bg-emerald-100 px-1 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : selected.has(i)
                    ? 'rounded bg-red-100 px-1 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                    : 'text-slate-600 dark:text-slate-300'
              }
            >
              {t}
            </span>
          ))}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Clicca le parole che descrivono un comportamento scorretto, poi verifica.
      </p>
      <p className="card flex flex-wrap gap-1 p-4 text-sm leading-relaxed">
        {tokens.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className={`rounded px-1 transition ${
              selected.has(i)
                ? 'bg-accent-100 text-accent-800 dark:bg-accent-500/20 dark:text-accent-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </p>
      <button type="button" onClick={submit} disabled={selected.size === 0} className="btn-primary w-fit disabled:opacity-50">
        Verifica
      </button>
    </div>
  );
}
