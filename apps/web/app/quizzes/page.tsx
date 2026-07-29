import Link from 'next/link';
import { api } from '@/lib/api';
import type { QuizSummary } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function QuizzesPage() {
  const quizzes = await api.get<QuizSummary[]>('/quizzes');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Quiz' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Quiz</h1>

      {quizzes.length === 0 ? (
        <EmptyState title="Nessun quiz disponibile" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Link key={quiz.id} href={`/quizzes/${quiz.id}`} className="card flex flex-col gap-2 p-4 hover:shadow-md">
              <LevelBadge level={quiz.level} />
              <p className="font-medium text-slate-800 dark:text-slate-100">{quiz.title}</p>
              <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{quiz.description}</p>
              <p className="text-xs text-slate-400">
                {quiz.questionCount} domande · soglia {quiz.passThresholdPct}%
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
