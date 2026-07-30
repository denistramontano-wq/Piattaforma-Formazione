'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { CategoryFlat, Level } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FileUploadField } from '@/components/admin/FileUploadField';

export default function NewDocumentPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryFlat[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState<Level>('BASE');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [fileUrl, setFileUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<CategoryFlat[]>('/admin/categories').then(setCategories);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileUrl) {
      setError('Carica il file del manuale (versione 1) prima di continuare.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const doc = await api.post<{ id: string }>('/admin/documents', {
        title,
        description,
        author,
        categoryId: categoryId || null,
        level,
        estimatedMinutes,
        fileUrl,
      });
      router.push(`/admin/documents/${doc.id}`);
    } catch {
      setError('Creazione del manuale fallita. Riprova.');
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Manuali', href: '/admin/documents' },
          { label: 'Nuovo manuale' },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Nuovo manuale</h1>

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
            className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Autore</span>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Categoria</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {'—'.repeat(c.depth)} {c.name}
                </option>
              ))}
            </select>
          </label>
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
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Tempo stimato di lettura (minuti)</span>
          <input
            type="number"
            min={0}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        <FileUploadField label="File del manuale (v1)" accept=".pdf,.doc,.docx" value={fileUrl} onChange={setFileUrl} />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-fit">
          {saving ? 'Creazione…' : 'Crea manuale'}
        </button>
      </form>
    </div>
  );
}
