'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { AdminQuizListItem, Level, QuestionMode } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<AdminQuizListItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passThresholdPct, setPassThresholdPct] = useState('60');
  const [level, setLevel] = useState<Level>('BASE');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState('');
  const [questionMode, setQuestionMode] = useState<QuestionMode>('SEQUENTIAL');
  const [bankSize, setBankSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setQuizzes(await api.get<AdminQuizListItem[]>('/admin/quizzes'));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/quizzes', {
        title,
        description: description || null,
        passThresholdPct: Number(passThresholdPct) || 60,
        level,
        maxAttempts: maxAttempts ? Number(maxAttempts) : null,
        timeLimitSeconds: timeLimitSeconds ? Number(timeLimitSeconds) : null,
        questionMode,
        bankSize: bankSize ? Number(bankSize) : null,
      });
      setTitle('');
      setDescription('');
      setPassThresholdPct('60');
      setMaxAttempts('');
      setTimeLimitSeconds('');
      setBankSize('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.delete(`/admin/quizzes/${id}`);
      await load();
    } catch {
      setError('Impossibile eliminare: il quiz ha già dei tentativi registrati.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Quiz' },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">❓ Gestione quiz</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleCreate} className="card flex flex-col gap-3 p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Nuovo quiz</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Titolo</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Descrizione</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Livello</span>
              <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className={inputClass}>
                <option value="BASE">Base</option>
                <option value="INTERMEDIO">Intermedio</option>
                <option value="AVANZATO">Avanzato</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Soglia superamento %</span>
              <input type="number" value={passThresholdPct} onChange={(e) => setPassThresholdPct(e.target.value)} className={inputClass} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Tentativi max (vuoto = illimitati)</span>
              <input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Tempo limite (secondi)</span>
              <input type="number" value={timeLimitSeconds} onChange={(e) => setTimeLimitSeconds(e.target.value)} className={inputClass} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Ordine domande</span>
              <select value={questionMode} onChange={(e) => setQuestionMode(e.target.value as QuestionMode)} className={inputClass}>
                <option value="SEQUENTIAL">Sequenziale</option>
                <option value="RANDOM">Casuale</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Banca domande (N estratte, vuoto = tutte)</span>
              <input type="number" value={bankSize} onChange={(e) => setBankSize(e.target.value)} className={inputClass} />
            </label>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-fit">
            {saving ? 'Creazione…' : 'Crea quiz'}
          </button>
        </form>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Quiz esistenti</h2>
          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {quizzes.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <Link href={`/admin/quizzes/${q.id}`} className="font-medium text-slate-700 hover:text-accent-600 dark:text-slate-200">
                    {q.title}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {q.questionCount} domande · {q.attemptCount} tentativi {q.lessonTitle && `· lezione: ${q.lessonTitle}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/admin/quizzes/${q.id}`} className="text-xs text-accent-600 hover:underline dark:text-accent-400">
                    Gestisci
                  </Link>
                  <button type="button" onClick={() => handleDelete(q.id)} className="text-xs text-rose-600 hover:underline dark:text-rose-400">
                    Elimina
                  </button>
                </div>
              </div>
            ))}
            {quizzes.length === 0 && <p className="py-4 text-sm text-slate-400">Nessun quiz ancora creato.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
