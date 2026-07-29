import { api } from '@/lib/api';
import type { CourseSummary } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { CourseCard } from '@/components/ui/CourseCard';
import { EmptyState } from '@/components/ui/EmptyState';

const LEVELS = [
  { value: '', label: 'Tutti i livelli' },
  { value: 'BASE', label: 'Base' },
  { value: 'INTERMEDIO', label: 'Intermedio' },
  { value: 'AVANZATO', label: 'Avanzato' },
];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; category?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.level) query.set('level', params.level);
  if (params.category) query.set('category', params.category);
  if (params.tag) query.set('tag', params.tag);

  const courses = await api.get<CourseSummary[]>(`/courses?${query.toString()}`);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Catalogo corsi' }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Catalogo corsi</h1>
        <form className="flex flex-wrap items-center gap-2" action="/courses">
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Cerca un corso…"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <select
            name="level"
            defaultValue={params.level ?? ''}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">
            Filtra
          </button>
        </form>
      </div>

      {courses.length === 0 ? (
        <EmptyState title="Nessun corso trovato" description="Prova a modificare i filtri di ricerca." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
