import Link from 'next/link';
import { api } from '@/lib/api';
import type { AdminOverview } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const data = await api.get<AdminOverview>('/admin/stats/overview');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Dashboard amministratore' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard amministratore</h1>
        <Link href="/admin/courses" className="btn-secondary">
          Gestisci corsi
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Utenti totali" value={data.totalUsers} />
        <StatCard label="Corsi pubblicati" value={data.totalCourses} />
        <StatCard label="Iscrizioni totali" value={data.totalEnrollments} />
        <StatCard label="Completamenti" value={data.completedEnrollments} />
        <StatCard label="Punteggio medio quiz" value={`${data.avgQuizScore}%`} />
        <StatCard label="Tasso superamento quiz" value={`${data.quizPassRatePct}%`} />
        <StatCard label="Utenti inattivi (30gg)" value={data.inactiveUsers} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Corsi più seguiti</h2>
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {data.topCourses.map((c) => (
            <div key={c.slug} className="flex items-center justify-between p-4 text-sm">
              <Link href={`/courses/${c.slug}`} className="font-medium text-slate-700 hover:text-accent-600 dark:text-slate-200 dark:hover:text-accent-400">
                {c.title}
              </Link>
              <span className="text-slate-500 dark:text-slate-400">{c.enrollments} iscritti</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-400">
        L'editor CMS completo (creazione corsi/moduli/lezioni no-code) è descritto in docs/02-gestione-contenuti.md
        ed è pianificato come prossimo modulo dello scaffold.
      </p>
    </div>
  );
}
