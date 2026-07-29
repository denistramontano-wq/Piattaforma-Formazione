import { api } from '@/lib/api';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

interface DocumentDetail {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  category: { name: string; slug: string } | null;
  versions: { versionNumber: number; fileUrl: string; changelog: string | null; isCurrent: boolean; createdAt: string }[];
}

export default async function ManualDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await api.get<DocumentDetail>(`/documents/${id}`);
  const current = doc.versions.find((v) => v.isCurrent) ?? doc.versions[0];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Manuali', href: '/manuals' }, { label: doc.title }]} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{doc.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {doc.author} {doc.category && `· ${doc.category.name}`}
          </p>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{doc.description}</p>

          <div className="mt-6 flex h-96 items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-slate-500 dark:border-slate-700">
            <div>
              <p className="text-sm">📄 Anteprima documento (viewer PDF inline)</p>
              <p className="mt-1 text-xs text-slate-400">{current?.fileUrl}</p>
            </div>
          </div>
          <a href={current?.fileUrl} className="btn-primary mt-4 w-fit">
            Scarica versione corrente
          </a>
        </div>

        <aside className="card h-fit p-4">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Storico versioni</h2>
          <ul className="flex flex-col gap-3">
            {doc.versions.map((v) => (
              <li key={v.versionNumber} className="text-sm">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  v{v.versionNumber} {v.isCurrent && <span className="badge bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400">corrente</span>}
                </p>
                {v.changelog && <p className="text-slate-500 dark:text-slate-400">{v.changelog}</p>}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
