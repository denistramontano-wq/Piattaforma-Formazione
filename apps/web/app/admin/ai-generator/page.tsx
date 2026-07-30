'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { AiGeneration, AiGenerationType, AiSourceOption, AiUsageSummary } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { GenerationOutput } from '@/components/admin/ai/GenerationOutput';

const TYPE_OPTIONS: { value: AiGenerationType; label: string; icon: string }[] = [
  { value: 'SUMMARY', label: 'Riassunto', icon: '📝' },
  { value: 'FLASHCARDS', label: 'Flashcard', icon: '🗂️' },
  { value: 'QUIZ', label: 'Quiz', icon: '❓' },
  { value: 'CONCEPT_MAP', label: 'Mappa concettuale', icon: '🕸️' },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

export default function AiGeneratorPage() {
  const [sources, setSources] = useState<AiSourceOption[]>([]);
  const [sourceKey, setSourceKey] = useState('');
  const [type, setType] = useState<AiGenerationType>('SUMMARY');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generations, setGenerations] = useState<AiGeneration[]>([]);
  const [selected, setSelected] = useState<AiGeneration | null>(null);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  async function loadAll() {
    const [s, g, u] = await Promise.all([
      api.get<AiSourceOption[]>('/admin/ai/sources'),
      api.get<AiGeneration[]>('/admin/ai/generations'),
      api.get<AiUsageSummary>('/admin/ai/usage'),
    ]);
    setSources(s);
    setGenerations(g);
    setUsage(u);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleGenerate() {
    if (!sourceKey) {
      setError('Seleziona una fonte.');
      return;
    }
    const [sourceType, sourceId] = sourceKey.split('::');
    setGenerating(true);
    setError(null);
    try {
      const generation = await api.post<AiGeneration>('/admin/ai/generate', { sourceType, sourceId, generationType: type });
      setSelected(generation);
      await loadAll();
    } catch {
      setError('Generazione fallita. Verifica che la fonte selezionata abbia del testo disponibile.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(id: string) {
    setBusyAction(true);
    try {
      const updated = await api.post<AiGeneration>(`/admin/ai/generations/${id}/approve`);
      setSelected(updated);
      await loadAll();
    } finally {
      setBusyAction(false);
    }
  }

  async function handleReject(id: string) {
    setBusyAction(true);
    try {
      const updated = await api.post<AiGeneration>(`/admin/ai/generations/${id}/reject`);
      setSelected(updated);
      await loadAll();
    } finally {
      setBusyAction(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Generatore IA' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Generatore di contenuti IA</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          L&apos;IA propone, tu approvi: ogni generazione resta in bozza finché non la rivedi e approvi esplicitamente.
        </p>
      </div>

      {usage && (
        <div className="card flex flex-wrap items-center gap-6 p-4 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Provider attivo:{' '}
            <strong className="text-slate-800 dark:text-slate-100">
              {usage.byProvider.anthropic ? 'anthropic (Claude)' : 'local (algoritmo senza chiave IA)'}
            </strong>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Chiamate totali: <strong className="text-slate-800 dark:text-slate-100">{usage.totalCalls}</strong>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Token totali: <strong className="text-slate-800 dark:text-slate-100">{usage.totalTokens}</strong>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Costo stimato: <strong className="text-slate-800 dark:text-slate-100">${usage.totalCostUsd.toFixed(4)}</strong>
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col gap-4 p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Nuova generazione</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Fonte (manuale o lezione)</span>
            <select
              value={sourceKey}
              onChange={(e) => setSourceKey(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">— Seleziona —</option>
              {sources.map((s) => (
                <option key={`${s.sourceType}::${s.sourceId}`} value={`${s.sourceType}::${s.sourceId}`}>
                  {s.context} — {s.title}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Tipo di generazione</span>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${
                    type === opt.value
                      ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button type="button" onClick={handleGenerate} disabled={generating} className="btn-primary w-fit">
            {generating ? 'Generazione in corso…' : 'Genera'}
          </button>

          <div className="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Storico</h3>
            <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
              {generations.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelected(g)}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${
                    selected?.id === g.id ? 'bg-accent-50 dark:bg-accent-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate text-slate-600 dark:text-slate-300">
                    {TYPE_OPTIONS.find((t) => t.value === g.generationType)?.icon} {g.sourceTitle}
                  </span>
                  <span className={`badge shrink-0 ${STATUS_STYLE[g.reviewStatus]}`}>{g.reviewStatus}</span>
                </button>
              ))}
              {generations.length === 0 && <p className="text-xs text-slate-400">Nessuna generazione ancora.</p>}
            </div>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          {!selected ? (
            <p className="text-sm text-slate-400">Genera un contenuto o seleziona una voce dallo storico per rivederla.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{selected.sourceTitle}</p>
                  <p className="text-xs text-slate-400">
                    {TYPE_OPTIONS.find((t) => t.value === selected.generationType)?.label} · provider: {selected.provider}
                  </p>
                </div>
                <span className={`badge ${STATUS_STYLE[selected.reviewStatus]}`}>{selected.reviewStatus}</span>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <GenerationOutput generation={selected} />
              </div>

              {selected.reviewStatus === 'PENDING' ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleApprove(selected.id)} disabled={busyAction} className="btn-primary">
                    ✅ Approva e pubblica
                  </button>
                  <button type="button" onClick={() => handleReject(selected.id)} disabled={busyAction} className="btn-secondary">
                    Scarta
                  </button>
                </div>
              ) : (
                selected.reviewStatus === 'APPROVED' &&
                selected.resultRefId && (
                  <Link
                    href={selected.generationType === 'FLASHCARDS' ? `/games/${selected.resultRefId}` : `/quizzes/${selected.resultRefId}`}
                    target="_blank"
                    className="btn-secondary w-fit"
                  >
                    Vai al contenuto pubblicato →
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
