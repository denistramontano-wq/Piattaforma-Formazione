'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { QuizDetail, QuizResult } from '@/lib/types';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function QuizPlayer({ quiz }: { quiz: QuizDetail }) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = Object.keys(answers).length;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await api.post<QuizResult>(`/quizzes/${quiz.id}/submit`, { answers });
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="card p-6">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Risultato</p>
        <p className={`mt-1 text-3xl font-semibold ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
          {Math.round(result.scorePct)}%
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {result.passed ? '✅ Quiz superato!' : '❌ Soglia non raggiunta, riprova.'}
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {quiz.questions.map((q, i) => {
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Domande risposte</span>
          <span>
            {answeredCount}/{quiz.questions.length}
          </span>
        </div>
        <ProgressBar value={(answeredCount / quiz.questions.length) * 100} />
      </div>

      {quiz.questions.map((q, i) => (
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
  question: QuizDetail['questions'][number];
  value: any;
  onChange: (v: any) => void;
}) {
  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'IMAGE_CHOICE':
      return (
        <div className="flex flex-col gap-2">
          {question.payload.options.map((opt: { id: string; text?: string; imageUrl?: string }) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(opt.id)}
                onChange={(e) => {
                  const current: string[] = Array.isArray(value) ? value : [];
                  onChange(e.target.checked ? [...current, opt.id] : current.filter((v) => v !== opt.id));
                }}
              />
              {opt.text ?? opt.imageUrl}
            </label>
          ))}
        </div>
      );
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
      return <p className="text-sm text-slate-400">Tipo di domanda in sviluppo (drag & drop).</p>;
  }
}
