import { api } from '@/lib/api';
import type { ProgressOverview } from '@/lib/types';
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

export default async function ProgressPage() {
  const data = await api.get<ProgressOverview>('/me/progress');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Progressi' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">I miei progressi</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Corsi completati" value={data.completedCourses} />
        <StatCard label="Corsi in corso" value={data.inProgressCourses} />
        <StatCard label="Tempo di studio" value={`${data.totalStudyMinutes} min`} />
        <StatCard label="Punteggio medio quiz" value={`${data.avgQuizScore}%`} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Avanzamento per corso</h2>
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {data.courses.map((c) => (
            <div key={c.slug} className="flex items-center justify-between gap-4 p-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.title}</p>
              <div className="w-48">
                <ProgressBar value={c.progressPct} />
              </div>
            </div>
          ))}
          {data.courses.length === 0 && (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Nessun corso ancora iniziato.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Ultimi risultati quiz</h2>
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {data.recentQuizResults.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-4 text-sm">
              <span className="text-slate-700 dark:text-slate-200">{r.quizTitle}</span>
              <span className={r.passed ? 'text-emerald-600' : 'text-rose-600'}>
                {r.scorePct !== null ? `${Math.round(r.scorePct)}%` : '—'}
              </span>
            </div>
          ))}
          {data.recentQuizResults.length === 0 && (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Nessun quiz svolto ancora.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Badge ottenuti</h2>
        <div className="flex flex-wrap gap-2">
          {data.badges.map((b, i) => (
            <span key={i} className="badge bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400">
              🏅 {b.name}
            </span>
          ))}
          {data.badges.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nessun badge ancora.</p>}
        </div>
      </section>
    </div>
  );
}
