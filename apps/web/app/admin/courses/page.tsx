import Link from 'next/link';
import { api } from '@/lib/api';
import type { AdminCourseListItem } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function AdminCoursesPage() {
  const courses = await api.get<AdminCourseListItem[]>('/admin/courses');

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
        <Link href="/admin/courses/new" className="btn-primary">
          + Nuovo corso
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Titolo</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Livello</th>
              <th className="px-4 py-3">Moduli</th>
              <th className="px-4 py-3">Lezioni</th>
              <th className="px-4 py-3">Iscritti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/courses/${c.id}/edit`}
                    className="font-medium text-accent-600 hover:underline dark:text-accent-400"
                  >
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.categories[0]?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.level}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.modules.length}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {c.modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c._count.enrollments}</td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Nessun corso ancora creato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
