'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CategoryFlat } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryFlat[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setCategories(await api.get<CategoryFlat[]>('/admin/categories'));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/categories', { name, parentId: parentId || null });
      setName('');
      setParentId('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.delete(`/admin/categories/${id}`);
      await load();
    } catch {
      setError('Impossibile eliminare: la categoria ha sottocategorie o contenuti collegati.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Categorie' },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Gestione categorie</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleCreate} className="card flex flex-col gap-3 p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Nuova categoria</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Categoria genitore (opzionale)</span>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">— Nessuna (categoria di primo livello) —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {'—'.repeat(c.depth)} {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-fit">
            {saving ? 'Creazione…' : 'Crea categoria'}
          </button>
        </form>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Tassonomia</h2>
          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-slate-700 dark:text-slate-200" style={{ paddingLeft: c.depth * 16 }}>
                  {c.depth > 0 && '↳ '}
                  {c.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{c.usageCount} contenuti collegati</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-rose-600 hover:underline dark:text-rose-400"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="py-4 text-sm text-slate-400">Nessuna categoria ancora creata.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
