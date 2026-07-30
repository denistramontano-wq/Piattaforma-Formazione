'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { api } from '@/lib/api';
import type { AdminDocument } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FileUploadField } from '@/components/admin/FileUploadField';

export default function AdminDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [doc, setDoc] = useState<AdminDocument | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [changelog, setChangelog] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const documents = await api.get<AdminDocument[]>('/admin/documents');
    setDoc(documents.find((d) => d.id === id) ?? null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleNewVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!fileUrl) return;
    setSaving(true);
    try {
      await api.post(`/admin/documents/${id}/versions`, { fileUrl, changelog });
      setFileUrl('');
      setChangelog('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!doc) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Caricamento…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Manuali', href: '/admin/documents' },
          { label: doc.title },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{doc.title}</h1>
      <p className="text-slate-500 dark:text-slate-400">{doc.description}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Storico versioni</h2>
          <ul className="flex flex-col gap-3">
            {doc.versions.map((v) => (
              <li key={v.versionNumber} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  v{v.versionNumber}{' '}
                  {v.isCurrent && (
                    <span className="badge bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400">
                      corrente
                    </span>
                  )}
                </p>
                {v.changelog && <p className="mt-1 text-slate-500 dark:text-slate-400">{v.changelog}</p>}
                <a href={v.fileUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-accent-600 hover:underline dark:text-accent-400">
                  {v.fileUrl}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleNewVersion} className="card flex h-fit flex-col gap-4 p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Carica nuova versione</h2>
          <FileUploadField label="Nuovo file" accept=".pdf,.doc,.docx" value={fileUrl} onChange={setFileUrl} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Note di versione (changelog)</span>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              rows={3}
              placeholder="Es. Aggiornate planimetrie sede Milano"
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <button type="submit" disabled={saving || !fileUrl} className="btn-primary w-fit">
            {saving ? 'Caricamento…' : 'Pubblica nuova versione'}
          </button>
        </form>
      </div>
    </div>
  );
}
