import Image from 'next/image';
import Link from 'next/link';
import { LevelBadge } from './LevelBadge';
import { ProgressBar } from './ProgressBar';
import type { CourseSummary } from '@/lib/types';

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link href={`/courses/${course.slug}`} className="card group flex flex-col overflow-hidden transition hover:shadow-md">
      <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800">
        {course.coverUrl && (
          <Image
            src={course.coverUrl}
            alt=""
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 320px"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <LevelBadge level={course.level} />
          {course.categories[0] && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{course.categories[0].name}</span>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{course.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{course.description}</p>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{course.lessonCount} lezioni</span>
          <span>{course.estimatedMinutes} min</span>
        </div>
        {course.enrollment && (
          <div className="pt-1">
            <ProgressBar value={course.enrollment.progressPct} />
          </div>
        )}
      </div>
    </Link>
  );
}
