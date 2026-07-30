import Link from 'next/link';
import { api } from '@/lib/api';
import type { LeaderboardPeriod, LeaderboardResponse } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'Settimanale' },
  { value: 'monthly', label: 'Mensile' },
  { value: 'alltime', label: 'Sempre' },
];

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: LeaderboardPeriod }>;
}) {
  const { period = 'alltime' } = await searchParams;
  const data = await api.get<LeaderboardResponse>(`/leaderboard?period=${period}`);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Classifica' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">🏆 Classifica</h1>

      <div className="flex gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/leaderboard?period=${p.value}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              period === p.value
                ? 'bg-accent-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {data.entries.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Nessuna attività in questo periodo"
          description="Completa lezioni, quiz e mini giochi per guadagnare XP e scalare la classifica."
        />
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {data.entries.map((e) => (
            <div
              key={e.userId}
              className={`flex items-center justify-between gap-3 p-4 ${
                e.isCurrentUser ? 'bg-accent-50 dark:bg-accent-500/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-center text-lg font-semibold text-slate-500 dark:text-slate-400">
                  {MEDALS[e.rank] ?? e.rank}
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {e.fullName}
                  {e.isCurrentUser && (
                    <span className="ml-2 text-xs font-normal text-accent-600 dark:text-accent-400">(tu)</span>
                  )}
                </span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{e.points} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
