import Link from 'next/link';
import { api } from '@/lib/api';
import type { DocumentSummary } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function ManualsPage() {
  const documents = await api.get<DocumentSummary[]>('/documents');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Manuali' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Manuali</h1>

      {documents.length === 0 ? (
        <EmptyState title="Nessun manuale disponibile" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link key={doc.id} href={`/manuals/${doc.id}`} className="card flex flex-col gap-2 p-4 hover:shadow-md">
              <div className="flex items-center gap-2">
                <span aria-hidden>📄</span>
                {doc.category && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{doc.category.name}</span>
                )}
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{doc.title}</p>
              <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{doc.description}</p>
              <p className="text-xs text-slate-400">v{doc.versions[0]?.versionNumber ?? 1} · {doc.estimatedMinutes} min</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
