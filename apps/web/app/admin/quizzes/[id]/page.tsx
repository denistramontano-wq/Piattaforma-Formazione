'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { AdminQuestion, AdminQuizDetail, Level, QuestionMode, QuizAnalytics } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { QuestionForm } from '@/components/admin/quiz/QuestionForm';

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800';

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Risposta multipla',
  TRUE_FALSE: 'Vero/Falso',
  OPEN_TEXT: 'Risposta aperta',
  FILL_BLANK: 'Completamento frase',
  DRAG_DROP: 'Trascinamento elementi',
  ORDERING: 'Ordinamento',
  IMAGE_CHOICE: 'Selezione immagini',
};

export default function AdminQuizEditPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<AdminQuizDetail | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  async function load() {
    const [q, a] = await Promise.all([
      api.get<AdminQuizDetail>(`/admin/quizzes/${id}`),
      api.get<QuizAnalytics>(`/admin/quizzes/${id}/analytics`),
    ]);
    setQuiz(q);
    setAnalytics(a);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveMeta() {
    if (!quiz) return;
    setSavingMeta(true);
    try {
      await api.put(`/admin/quizzes/${id}`, {
        title: quiz.title,
        description: quiz.description,
        passThresholdPct: quiz.passThresholdPct,
        level: quiz.level,
        maxAttempts: quiz.maxAttempts,
        timeLimitSeconds: quiz.timeLimitSeconds,
        questionMode: quiz.questionMode,
        bankSize: quiz.bankSize,
      });
      await load();
    } finally {
      setSavingMeta(false);
    }
  }

  async function deleteQuestion(qid: string) {
    await api.delete(`/admin/questions/${qid}`);
    await load();
  }

  async function moveQuestion(qid: string, direction: 'up' | 'down') {
    await api.patch(`/admin/questions/${qid}/move`, { direction });
    await load();
  }

  if (!quiz) {
    return <p className="text-sm text-slate-400">Caricamento…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Quiz', href: '/admin/quizzes' },
          { label: quiz.title },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</h1>

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Impostazioni</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Titolo</span>
            <input value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Livello</span>
            <select value={quiz.level} onChange={(e) => setQuiz({ ...quiz, level: e.target.value as Level })} className={inputClass}>
              <option value="BASE">Base</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZATO">Avanzato</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Descrizione</span>
          <textarea
            value={quiz.description ?? ''}
            onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Soglia %</span>
            <input
              type="number"
              value={quiz.passThresholdPct}
              onChange={(e) => setQuiz({ ...quiz, passThresholdPct: Number(e.target.value) })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Tentativi max</span>
            <input
              type="number"
              value={quiz.maxAttempts ?? ''}
              onChange={(e) => setQuiz({ ...quiz, maxAttempts: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
              placeholder="illimitati"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Tempo limite (s)</span>
            <input
              type="number"
              value={quiz.timeLimitSeconds ?? ''}
              onChange={(e) => setQuiz({ ...quiz, timeLimitSeconds: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
              placeholder="nessuno"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Banca domande (N)</span>
            <input
              type="number"
              value={quiz.bankSize ?? ''}
              onChange={(e) => setQuiz({ ...quiz, bankSize: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
              placeholder="tutte"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm sm:w-64">
          <span className="text-slate-600 dark:text-slate-300">Ordine domande</span>
          <select
            value={quiz.questionMode}
            onChange={(e) => setQuiz({ ...quiz, questionMode: e.target.value as QuestionMode })}
            className={inputClass}
          >
            <option value="SEQUENTIAL">Sequenziale</option>
            <option value="RANDOM">Casuale</option>
          </select>
        </label>
        <button type="button" onClick={saveMeta} disabled={savingMeta} className="btn-primary w-fit">
          {savingMeta ? 'Salvataggio…' : 'Salva impostazioni'}
        </button>
      </section>

      {analytics && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Analytics</h2>
          <div className="mb-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{analytics.attemptCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tentativi</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{analytics.avgScorePct}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Punteggio medio</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{analytics.passRatePct}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tasso di superamento</p>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {analytics.questions.map((q) => (
              <div key={q.questionId} className="flex items-center justify-between gap-3 py-2">
                <span className="text-slate-600 dark:text-slate-300">{q.prompt}</span>
                <span className={q.errorRatePct !== null && q.errorRatePct > 0 ? 'text-rose-600' : 'text-slate-400'}>
                  {q.errorRatePct !== null ? `${q.errorRatePct}% errori (${q.totalAnswers} risposte)` : 'nessun dato'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Domande ({quiz.questions.length})</h2>
          <button type="button" onClick={() => setAddingQuestion((v) => !v)} className="btn-secondary">
            {addingQuestion ? 'Chiudi' : '+ Aggiungi domanda'}
          </button>
        </div>

        {addingQuestion && (
          <QuestionForm
            quizId={quiz.id}
            onSaved={() => {
              setAddingQuestion(false);
              load();
            }}
            onCancel={() => setAddingQuestion(false)}
          />
        )}

        {quiz.questions.map((q: AdminQuestion, i: number) => (
          <div key={q.id}>
            {editingQuestionId === q.id ? (
              <QuestionForm
                quizId={quiz.id}
                existing={q}
                onSaved={() => {
                  setEditingQuestionId(null);
                  load();
                }}
                onCancel={() => setEditingQuestionId(null)}
              />
            ) : (
              <div className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {i + 1}. {q.prompt}
                  </p>
                  <p className="text-xs text-slate-400">
                    {TYPE_LABELS[q.type] ?? q.type} · peso {q.scoreWeight} · {q.difficulty}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button type="button" onClick={() => moveQuestion(q.id, 'up')} className="btn-secondary px-2 py-1">
                    ↑
                  </button>
                  <button type="button" onClick={() => moveQuestion(q.id, 'down')} className="btn-secondary px-2 py-1">
                    ↓
                  </button>
                  <button type="button" onClick={() => setEditingQuestionId(q.id)} className="text-accent-600 hover:underline dark:text-accent-400">
                    Modifica
                  </button>
                  <button type="button" onClick={() => deleteQuestion(q.id)} className="text-rose-600 hover:underline dark:text-rose-400">
                    Elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {quiz.questions.length === 0 && !addingQuestion && (
          <p className="card p-4 text-sm text-slate-400">Nessuna domanda ancora aggiunta.</p>
        )}
      </section>
    </div>
  );
}
