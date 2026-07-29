import Link from 'next/link';
import { api } from '@/lib/api';
import type { UserDashboard } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ProgressBar } from '@/components/ui/ProgressBar';

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

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">La mia dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Livello {data.user.level} · {data.user.totalXp} XP
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Corsi in corso" value={data.coursesInProgress} />
        <StatCard label="Corsi completati" value={data.coursesCompleted} />
        <StatCard label="Certificati" value={data.certificatesCount} />
        <StatCard label="Badge ottenuti" value={data.badgeCount} />
      </div>

      <section>
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
    </div>
  );
}
