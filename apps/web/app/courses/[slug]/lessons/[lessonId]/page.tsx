import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import type { LessonDetail } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const lesson = await api.get<LessonDetail>(`/lessons/${lessonId}`);

  async function completeLesson() {
    'use server';
    await api.post(`/lessons/${lessonId}/complete`);
    redirect(`/courses/${slug}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Catalogo corsi', href: '/courses' },
          { label: lesson.course.title, href: `/courses/${slug}` },
          { label: lesson.title },
        ]}
      />

      <div className="card p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-600 dark:text-accent-400">
          {lesson.module.title}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{lesson.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lesson.estimatedMinutes} minuti stimati</p>

        <div className="mt-6">
          {lesson.contentType === 'VIDEO' && (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-900 text-slate-300">
              <p className="text-sm">▶ Player video (HLS) — {lesson.videoUrl}</p>
            </div>
          )}
          {lesson.contentType === 'PDF' && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500 dark:border-slate-700">
              <p className="text-sm">📄 Viewer PDF inline — {lesson.contentBody}</p>
            </div>
          )}
          {lesson.contentType === 'TEXT' && (
            <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
              {lesson.contentBody}
            </p>
          )}
        </div>

        {lesson.quizzes.length > 0 && (
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Quiz di verifica</p>
            {lesson.quizzes.map((q) => (
              <Link key={q.id} href={`/quizzes/${q.id}`} className="btn-secondary w-fit">
                Svolgi: {q.title}
              </Link>
            ))}
          </div>
        )}

        <form action={completeLesson} className="mt-6">
          <button type="submit" className="btn-primary">
            Segna come completata
          </button>
        </form>
      </div>
    </div>
  );
}
