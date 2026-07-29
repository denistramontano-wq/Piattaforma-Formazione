import Image from 'next/image';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import type { CourseDetail } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await api.get<CourseDetail>(`/courses/${slug}`);

  async function enroll() {
    'use server';
    await api.post(`/courses/${slug}/enroll`);
    revalidatePath(`/courses/${slug}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Catalogo corsi', href: '/courses' },
          { label: course.title },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative mb-4 h-56 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {course.coverUrl && <Image src={course.coverUrl} alt="" fill className="object-cover" sizes="800px" />}
          </div>
          <div className="mb-3 flex items-center gap-2">
            <LevelBadge level={course.level} />
            {course.categories.map((c) => (
              <span key={c.slug} className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {c.name}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{course.title}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{course.description}</p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            A cura di {course.author} · {course.estimatedMinutes} minuti stimati
          </p>

          {!course.enrollment ? (
            <form action={enroll} className="mt-5">
              <button type="submit" className="btn-primary">
                Iscriviti al corso
              </button>
            </form>
          ) : (
            <div className="mt-5 max-w-xs">
              <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Avanzamento</span>
                <span>{Math.round(course.enrollment.progressPct)}%</span>
              </div>
              <ProgressBar value={course.enrollment.progressPct} />
            </div>
          )}
        </div>

        <aside className="card h-fit p-4">
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Contenuto del corso</h2>
          <div className="flex flex-col gap-4">
            {course.modules.map((m) => (
              <div key={m.id}>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{m.title}</p>
                <ul className="flex flex-col gap-1">
                  {m.lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/courses/${slug}/lessons/${l.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <span aria-hidden>{l.completed ? '✅' : contentIcon(l.contentType)}</span>
                          {l.title}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">{l.estimatedMinutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function contentIcon(type: string) {
  if (type === 'VIDEO') return '🎬';
  if (type === 'PDF') return '📄';
  return '📖';
}
