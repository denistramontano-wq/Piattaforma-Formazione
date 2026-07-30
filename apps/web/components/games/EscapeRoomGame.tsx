'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Step {
  id: string;
  narrative: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  unlockNarrative: string;
}

export function EscapeRoomGame({
  gameId,
  intro,
  steps,
}: {
  gameId: string;
  intro: string;
  steps: Step[];
}) {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [escaped, setEscaped] = useState(false);
  const startedAt = useState(() => Date.now())[0];

  const step = steps[stepIndex];

  function answer(optionIndex: number) {
    if (optionIndex === step.correctIndex) {
      setUnlocked(true);
    } else {
      setMistakes((m) => m + 1);
    }
  }

  function proceed() {
    setUnlocked(false);
    if (stepIndex + 1 >= steps.length) {
      const score = Math.max(20, 100 - mistakes * 15);
      setEscaped(true);
      api.post(`/games/${gameId}/sessions`, {
        score,
        durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      });
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  if (!started) {
    return (
      <div className="card flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-3xl">🔐</p>
        <p className="text-slate-600 dark:text-slate-300">{intro}</p>
        <button type="button" className="btn-primary" onClick={() => setStarted(true)}>
          Entra nella escape room
        </button>
      </div>
    );
  }

  if (escaped) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">🏁</p>
        <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Sei uscito in sicurezza! ({mistakes} {mistakes === 1 ? 'errore' : 'errori'})
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Prova {stepIndex + 1} di {steps.length}
      </p>
      <div className="card p-6">
        <p className="mb-4 italic text-slate-500 dark:text-slate-400">{step.narrative}</p>
        {unlocked ? (
          <div className="flex flex-col gap-4">
            <p className="text-emerald-600 dark:text-emerald-400">✅ {step.unlockNarrative}</p>
            <button type="button" onClick={proceed} className="btn-primary w-fit">
              {stepIndex + 1 >= steps.length ? 'Esci dallo stabilimento' : 'Prosegui'}
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 font-medium text-slate-800 dark:text-slate-100">{step.prompt}</p>
            <div className="flex flex-col gap-2">
              {step.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => answer(i)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm transition hover:border-accent-400 hover:bg-accent-50 dark:border-slate-700 dark:hover:bg-accent-500/10"
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
