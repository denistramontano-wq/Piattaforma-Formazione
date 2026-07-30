import Link from 'next/link';
import { api } from '@/lib/api';
import type { AdminDocument } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default async function AdminDocumentsPage() {
  const documents = await api.get<AdminDocument[]>('/admin/documents');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Manuali' },
        ]}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Gestione manuali</h1>
        <Link href="/admin/documents/new" className="btn-primary">
          + Nuovo manuale
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Titolo</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Versione corrente</th>
              <th className="px-4 py-3">Totale versioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {documents.map((doc) => {
              const current = doc.versions.find((v) => v.isCurrent) ?? doc.versions[0];
              return (
                <tr key={doc.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/documents/${doc.id}`}
                      className="font-medium text-accent-600 hover:underline dark:text-accent-400"
                    >
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{doc.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">v{current?.versionNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{doc.versions.length}</td>
                </tr>
              );
            })}
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nessun manuale ancora creato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
