import Link from 'next/link';
import { api } from '@/lib/api';
import type { UserDashboard } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusDonut } from '@/components/charts/StatusDonut';
import { WeeklyBarChart } from '@/components/charts/WeeklyBarChart';
import { QuizTrendChart } from '@/components/charts/QuizTrendChart';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const data = await api.get<UserDashboard>('/me/dashboard');
  const totalStudyMinutes = data.weeklyStudyMinutes.reduce((s, w) => s + w.minutes, 0);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />

      <div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-accent-500 to-accent-600 p-6 text-white">
        <div>
          <h1 className="text-2xl font-semibold">Bentornata, {data.user.fullName.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-accent-50">
            Livello {data.user.level} — {data.user.levelName} · {data.user.totalXp} XP
          </p>
          <div className="mt-3 h-2 w-64 max-w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${data.user.progressPct}%` }} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/profile" className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25">
            Vai al profilo
          </Link>
          <Link href="/courses" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">
            Continua a studiare
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Corsi in corso" value={data.coursesInProgress} />
        <StatCard label="Corsi completati" value={data.coursesCompleted} />
        <StatCard label="Certificati" value={data.certificatesCount} />
        <StatCard label="Badge ottenuti" value={data.badgeCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Andamento corsi</h2>
          <StatusDonut data={data.statusBreakdown} />
        </section>

        <section className="card p-5">
          <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Ultimi punteggi quiz</h2>
          <QuizTrendChart data={data.quizScoreTrend} />
        </section>

        <section className="card p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Tempo di studio settimanale</h2>
            <span className="text-xs text-slate-400">stimato, {totalStudyMinutes} min totali</span>
          </div>
          <WeeklyBarChart data={data.weeklyStudyMinutes} dataKey="minutes" xKey="week" label="minuti" color="#22c55e" />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">I miei corsi</h2>
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {data.courses.map((c) => (
              <Link
                key={c.slug}
                href={`/courses/${c.slug}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-100">{c.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {c.status === 'COMPLETED' ? 'Completato' : 'In corso'}
                  </p>
                </div>
                <div className="w-40">
                  <ProgressBar value={c.progressPct} />
                </div>
              </Link>
            ))}
            {data.courses.length === 0 && (
              <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
                Nessuna iscrizione ancora. Esplora il{' '}
                <Link href="/courses" className="text-accent-600 hover:underline dark:text-accent-400">
                  catalogo corsi
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Attività recente</h2>
          <div className="card p-5">
            <ActivityTimeline events={data.activityTimeline} />
          </div>
        </section>
      </div>
    </div>
  );
}
