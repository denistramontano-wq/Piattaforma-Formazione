'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { CategoryFlat, Level } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function NewCoursePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryFlat[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<Level>('BASE');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<CategoryFlat[]>('/admin/categories').then(setCategories);
  }, []);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const course = await api.post<{ id: string }>('/admin/courses', {
        title,
        description,
        level,
        estimatedMinutes,
        categoryIds,
      });
      router.push(`/admin/courses/${course.id}/edit`);
    } catch {
      setError('Creazione del corso fallita. Riprova.');
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Corsi', href: '/admin/courses' },
          { label: 'Nuovo corso' },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Nuovo corso</h1>

      <form onSubmit={handleSubmit} className="card flex max-w-xl flex-col gap-4 p-6">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Titolo</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Descrizione</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Livello</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="BASE">Base</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZATO">Avanzato</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Tempo stimato (minuti)</span>
            <input
              type="number"
              min={0}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
        </div>

        <div className="text-sm">
          <p className="mb-1 text-slate-600 dark:text-slate-300">Categorie</p>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                <span style={{ paddingLeft: c.depth * 12 }}>{c.name}</span>
              </label>
            ))}
            {categories.length === 0 && <p className="text-slate-400">Nessuna categoria ancora creata.</p>}
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-fit">
          {saving ? 'Creazione…' : 'Crea corso e continua'}
        </button>
        <p className="text-xs text-slate-400">
          Il corso viene creato come bozza. Potrai aggiungere moduli, lezioni e allegati nella schermata successiva.
        </p>
      </form>
    </div>
  );
}
