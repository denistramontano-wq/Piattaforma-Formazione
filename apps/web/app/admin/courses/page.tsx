import Link from 'next/link';
import { api } from '@/lib/api';
import type { CourseSummary } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default async function AdminCoursesPage() {
  const courses = await api.get<CourseSummary[]>('/courses');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Corsi' },
        ]}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Gestione corsi</h1>
        <button type="button" className="btn-primary" disabled title="Editor CMS in arrivo — docs/02-gestione-contenuti.md">
          + Nuovo corso
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Titolo</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Livello</th>
              <th className="px-4 py-3">Moduli</th>
              <th className="px-4 py-3">Lezioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <Link href={`/courses/${c.slug}`} className="font-medium text-accent-600 hover:underline dark:text-accent-400">
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.categories[0]?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.level}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.moduleCount}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.lessonCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Elenco in sola lettura. L'editor a blocchi per creare/modificare corsi, moduli e lezioni senza scrivere
        codice (upload PDF/Word/Excel/PowerPoint/immagini/video, versioning, pubblicazione programmata) è
        descritto in docs/02-gestione-contenuti.md e sarà il prossimo modulo implementato.
      </p>
    </div>
  );
}
