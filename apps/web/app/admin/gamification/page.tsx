'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AdminBadge, BadgeCodeOption, XpRule } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function AdminGamificationPage() {
  const [rules, setRules] = useState<XpRule[]>([]);
  const [badges, setBadges] = useState<AdminBadge[]>([]);
  const [availableCodes, setAvailableCodes] = useState<BadgeCodeOption[]>([]);
  const [editedPoints, setEditedPoints] = useState<Record<string, string>>({});
  const [savingRule, setSavingRule] = useState<string | null>(null);

  const [newBadgeCode, setNewBadgeCode] = useState('');
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDescription, setNewBadgeDescription] = useState('');
  const [creatingBadge, setCreatingBadge] = useState(false);

  async function load() {
    const [r, b, c] = await Promise.all([
      api.get<XpRule[]>('/admin/xp-rules'),
      api.get<AdminBadge[]>('/admin/badges'),
      api.get<BadgeCodeOption[]>('/admin/badges/available-codes'),
    ]);
    setRules(r);
    setBadges(b);
    setAvailableCodes(c);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveRule(rule: XpRule) {
    const raw = editedPoints[rule.action] ?? String(rule.points);
    const points = Number(raw);
    if (Number.isNaN(points)) return;
    setSavingRule(rule.action);
    try {
      await api.put(`/admin/xp-rules/${rule.action}`, { points, description: rule.description });
      await load();
    } finally {
      setSavingRule(null);
    }
  }

  async function createBadge(e: React.FormEvent) {
    e.preventDefault();
    if (!newBadgeCode || !newBadgeName.trim()) return;
    setCreatingBadge(true);
    try {
      await api.post('/admin/badges', {
        code: newBadgeCode,
        name: newBadgeName,
        criteriaDescription: newBadgeDescription || undefined,
      });
      setNewBadgeCode('');
      setNewBadgeName('');
      setNewBadgeDescription('');
      await load();
    } finally {
      setCreatingBadge(false);
    }
  }

  async function deleteBadge(id: string) {
    await api.delete(`/admin/badges/${id}`);
    await load();
  }

  const usedCodes = new Set(badges.map((b) => b.code));
  const freeCodes = availableCodes.filter((c) => !usedCodes.has(c.code));

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Regole gamification' },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">🎮 Regole gamification</h1>

      <section className="card p-5">
        <h2 className="mb-1 font-semibold text-slate-800 dark:text-slate-100">Punti XP per azione</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Docs/05 §5.2 — modifica i punti assegnati per ogni azione significativa dell&apos;utente.
        </p>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {rules.map((rule) => (
            <div key={rule.action} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">{rule.description}</p>
                <p className="text-xs text-slate-400">{rule.action}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editedPoints[rule.action] ?? String(rule.points)}
                  onChange={(e) => setEditedPoints((s) => ({ ...s, [rule.action]: e.target.value }))}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">XP</span>
                <button
                  type="button"
                  onClick={() => saveRule(rule)}
                  disabled={savingRule === rule.action}
                  className="btn-secondary"
                >
                  {savingRule === rule.action ? 'Salvataggio…' : 'Salva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={createBadge} className="card flex flex-col gap-3 p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Nuovo badge</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Regola di assegnazione</span>
            <select
              value={newBadgeCode}
              onChange={(e) => setNewBadgeCode(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">— Seleziona —</option>
              {freeCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Nome badge</span>
            <input
              value={newBadgeName}
              onChange={(e) => setNewBadgeName(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Descrizione (opzionale)</span>
            <textarea
              value={newBadgeDescription}
              onChange={(e) => setNewBadgeDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <button type="submit" disabled={creatingBadge || freeCodes.length === 0} className="btn-primary w-fit">
            {creatingBadge ? 'Creazione…' : 'Crea badge'}
          </button>
          {freeCodes.length === 0 && (
            <p className="text-xs text-slate-400">Tutte le regole di assegnazione disponibili sono già collegate a un badge.</p>
          )}
        </form>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Badge configurati</h2>
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {badges.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.criteriaDescription}</p>
                  {!b.hasAutoAwardRule && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ nessuna regola automatica collegata al codice &laquo;{b.code}&raquo;
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteBadge(b.id)}
                  className="text-xs text-rose-600 hover:underline dark:text-rose-400"
                >
                  Elimina
                </button>
              </div>
            ))}
            {badges.length === 0 && <p className="py-4 text-sm text-slate-400">Nessun badge configurato.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
