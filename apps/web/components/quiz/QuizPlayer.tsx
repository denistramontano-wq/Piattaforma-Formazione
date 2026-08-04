'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { QuizAttemptStart, QuizPreview, QuizQuestion, QuizResult } from '@/lib/types';
import { ProgressBar } from '@/components/ui/ProgressBar';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function QuizPlayer({ quiz }: { quiz: QuizPreview }) {
  const [attempt, setAttempt] = useState<QuizAttemptStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!attempt || attempt.timeLimitSeconds === null || result) return;
    if (timeLeft === null) {
      setTimeLeft(attempt.timeLimitSeconds);
      return;
    }
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, timeLeft, result]);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const started = await api.post<QuizAttemptStart>(`/quizzes/${quiz.id}/attempts`);
      setAttempt(started);
      setAnswers({});
      setResult(null);
      setTimeLeft(null);
    } catch {
      setError('Impossibile avviare il tentativo.');
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit() {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post<QuizResult>(`/attempts/${attempt.attemptId}/submit`, { answers });
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  if (result && attempt) {
    return (
      <div className="card p-6">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Risultato</p>
        <p className={`mt-1 text-3xl font-semibold ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
          {Math.round(result.scorePct)}%
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {result.passed ? '✅ Quiz superato!' : '❌ Soglia non raggiunta.'}
          {result.maxAttempts !== null && (
            <span className="text-slate-400"> · tentativi usati: {result.attemptsUsed}/{result.maxAttempts}</span>
          )}
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {attempt.questions.map((q, i) => {
            const detail = result.details.find((d) => d.questionId === q.id);
            return (
              <li key={q.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {i + 1}. {q.prompt} {detail?.correct ? '✅' : '❌'}
                </p>
                {detail?.explanation && (
                  <p className="mt-1 text-slate-500 dark:text-slate-400">{detail.explanation}</p>
                )}
              </li>
            );
          })}
        </ul>
        {result.canRetry && (
          <button type="button" onClick={handleStart} disabled={starting} className="btn-primary mt-4 w-fit">
            {starting ? 'Avvio…' : '🔁 Riprova'}
          </button>
        )}
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-slate-600 dark:text-slate-300">
          {quiz.questionCount} domande · soglia di superamento {quiz.passThresholdPct}%
          {quiz.timeLimitSeconds !== null && <> · tempo limite {formatTime(quiz.timeLimitSeconds)}</>}
        </p>
        {quiz.maxAttempts !== null && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tentativi usati: {quiz.attemptsUsed}/{quiz.maxAttempts}
          </p>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {quiz.canAttempt ? (
          <button type="button" onClick={handleStart} disabled={starting} className="btn-primary">
            {starting ? 'Avvio…' : 'Inizia quiz'}
          </button>
        ) : (
          <p className="text-sm text-rose-600">Hai esaurito i tentativi disponibili per questo quiz.</p>
        )}
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Domande risposte</span>
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <span className={`font-semibold ${timeLeft <= 30 ? 'text-red-500' : ''}`}>⏱ {formatTime(timeLeft)}</span>
            )}
            <span>
              {answeredCount}/{attempt.questions.length}
            </span>
          </div>
        </div>
        <ProgressBar value={(answeredCount / attempt.questions.length) * 100} />
      </div>

      {attempt.questions.map((q, i) => (
        <div key={q.id} className="card p-5">
          <p className="mb-3 font-medium text-slate-800 dark:text-slate-100">
            {i + 1}. {q.prompt}
          </p>
          <QuestionInput
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || answeredCount === 0}
        className="btn-primary w-fit"
      >
        {submitting ? 'Invio in corso…' : 'Invia risposte'}
      </button>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: any;
  onChange: (v: any) => void;
}) {
  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'IMAGE_CHOICE': {
      // Risposta singola (una sola corretta, impostata dall'admin): radio, come nei quiz "classici"
      // — impedisce di selezionarne più di una invece di lasciare che l'utente ne scelga tante
      // quante vuole. Risposta multipla: checkbox, come prima.
      const single = question.payload.single === true;
      return (
        <div className="flex flex-col gap-2">
          {question.payload.options.map((opt: { id: string; text?: string; imageUrl?: string }) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type={single ? 'radio' : 'checkbox'}
                name={single ? question.id : undefined}
                checked={Array.isArray(value) && value.includes(opt.id)}
                onChange={(e) => {
                  if (single) {
                    onChange(e.target.checked ? [opt.id] : []);
                    return;
                  }
                  const current: string[] = Array.isArray(value) ? value : [];
                  onChange(e.target.checked ? [...current, opt.id] : current.filter((v) => v !== opt.id));
                }}
              />
              {opt.text ?? opt.imageUrl}
            </label>
          ))}
        </div>
      );
    }
    case 'TRUE_FALSE':
      return (
        <div className="flex gap-3">
          {[true, false].map((b) => (
            <label key={String(b)} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="radio"
                name={question.id}
                checked={value === b}
                onChange={() => onChange(b)}
              />
              {b ? 'Vero' : 'Falso'}
            </label>
          ))}
        </div>
      );
    case 'FILL_BLANK':
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">{question.payload.text}</p>
          {Object.keys(question.payload.blanks ?? { '1': '' }).map((key) => (
            <input
              key={key}
              type="text"
              placeholder={`Risposta ${key}`}
              value={value?.[key] ?? ''}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          ))}
        </div>
      );
    case 'ORDERING': {
      const items: { id: string; label: string }[] = question.payload.items;
      const order: string[] = value ?? items.map((i) => i.id);
      function move(index: number, dir: -1 | 1) {
        const next = [...order];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
      }
      return (
        <ol className="flex flex-col gap-2">
          {order.map((id, index) => {
            const item = items.find((i) => i.id === id)!;
            return (
              <li key={id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-800">
                {item.label}
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(index, -1)} className="btn-secondary px-2 py-0.5">↑</button>
                  <button type="button" onClick={() => move(index, 1)} className="btn-secondary px-2 py-0.5">↓</button>
                </span>
              </li>
            );
          })}
        </ol>
      );
    }
    case 'DRAG_DROP':
      return <DragDropQuestionInput question={question} value={value} onChange={onChange} />;
    case 'OPEN_TEXT':
      return (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      );
    default:
      return <p className="text-sm text-slate-400">Tipo di domanda non supportato.</p>;
  }
}

function DragDropQuestionInput({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: any;
  onChange: (v: any) => void;
}) {
  const items: { id: string; label: string }[] = question.payload.items;
  const targets: { id: string; label: string }[] = question.payload.targets;
  const assignment: Record<string, string> = value ?? {};
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const remaining = items.filter((i) => !assignment[i.id]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {remaining.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedItem((cur) => (cur === item.id ? null : item.id))}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              selectedItem === item.id
                ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {targets.map((target) => {
          const placed = items.filter((i) => assignment[i.id] === target.id);
          return (
            <div
              key={target.id}
              onClick={() => {
                if (!selectedItem) return;
                onChange({ ...assignment, [selectedItem]: target.id });
                setSelectedItem(null);
              }}
              className="rounded-lg border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700"
            >
              <p className="font-medium text-slate-600 dark:text-slate-300">{target.label}</p>
              {placed.map((i) => (
                <span
                  key={i.id}
                  className="mt-1 block rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                >
                  {i.label}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
