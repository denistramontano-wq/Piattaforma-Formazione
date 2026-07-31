import { api } from '@/lib/api';
import type { QuizPreview } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { QuizPlayer } from '@/components/quiz/QuizPlayer';

export default async function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await api.get<QuizPreview>(`/quizzes/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Quiz', href: '/quizzes' }, { label: quiz.title }]} />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{quiz.description}</p>
      </div>
      <QuizPlayer quiz={quiz} />
    </div>
  );
}
