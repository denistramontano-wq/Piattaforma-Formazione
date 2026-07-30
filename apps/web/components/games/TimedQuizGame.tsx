'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export function TimedQuizGame({
  gameId,
  timeLimitSeconds,
  questions,
}: {
  gameId: string;
  timeLimitSeconds: number;
  questions: Question[];
}) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const startedAt = useState(() => Date.now())[0];

  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) {
      finish(correct);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, timeLeft, finished]);

  function finish(finalCorrect: number) {
    if (finished) return;
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    const accuracyPct = (finalCorrect / questions.length) * 100;
    const speedBonus = Math.max(0, timeLeft) * 0.5;
    const finalScore = Math.min(100, Math.round(accuracyPct + speedBonus));
    setScore(finalScore);
    setFinished(true);
    api.post(`/games/${gameId}/sessions`, { score: finalScore, durationSeconds });
  }

  function answer(optionIndex: number) {
    const q = questions[index];
    const isCorrect = optionIndex === q.correctIndex;
    const nextCorrect = isCorrect ? correct + 1 : correct;
    setCorrect(nextCorrect);
    if (index + 1 >= questions.length) {
      finish(nextCorrect);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (!started) {
    return (
      <div className="card flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-slate-600 dark:text-slate-300">
          Hai {timeLimitSeconds} secondi per rispondere a {questions.length} domande. Più sei veloce, più punti
          bonus ottieni.
        </p>
        <button type="button" className="btn-primary" onClick={() => setStarted(true)}>
          Inizia
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">⏱️</p>
        <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {correct}/{questions.length} corrette — Punteggio: {score}
        </p>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          Domanda {index + 1} di {questions.length}
        </span>
        <span className={`font-semibold ${timeLeft <= 10 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>
      <div className="card p-6">
        <p className="mb-4 font-medium text-slate-800 dark:text-slate-100">{q.prompt}</p>
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => (
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
      </div>
    </div>
  );
}
