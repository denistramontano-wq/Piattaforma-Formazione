import Link from 'next/link';
import { api } from '@/lib/api';
import type { AdminCourseStats, AdminOverview, InactiveUser, MostMissedQuestion } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { WeeklyBarChart } from '@/components/charts/WeeklyBarChart';
import { ExportCsvButton } from '@/components/admin/ExportCsvButton';

function formatLastActive(date: string | null): string {
  if (!date) return 'Mai';
  return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' });
}

export default async function AdminAnalyticsPage() {
  const [overview, courses, mostMissed, inactive] = await Promise.all([
    api.get<AdminOverview>('/admin/stats/overview'),
    api.get<AdminCourseStats[]>('/admin/stats/courses'),
    api.get<MostMissedQuestion[]>('/admin/stats/questions/most-missed'),
    api.get<InactiveUser[]>('/admin/users/inactive?days=30'),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard amministratore', href: '/admin' },
          { label: 'Analytics' },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">📊 Analytics</h1>

      <section className="card p-5">
        <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Nuove iscrizioni (ultime 8 settimane)</h2>
        <WeeklyBarChart data={overview.newUsersTrend} dataKey="count" xKey="week" label="nuovi utenti" />
      </section>

      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Corsi — funnel iscritti/completamenti</h2>
          <ExportCsvButton
            filename="corsi-analytics.csv"
            rows={courses.map((c) => ({
              corso: c.title,
              iscritti: c.enrollments,
              completamenti: c.completions,
              tasso_completamento_pct: c.completionRatePct,
              avanzamento_medio_pct: c.avgProgressPct,
              punteggio_medio_quiz: c.avgQuizScore ?? '',
            }))}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Corso</th>
                <th className="py-2 pr-4">Iscritti</th>
                <th className="py-2 pr-4">Completamenti</th>
                <th className="py-2 pr-4">Tasso completamento</th>
                <th className="py-2 pr-4">Avanzamento medio</th>
                <th className="py-2 pr-4">Punteggio medio quiz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {courses.map((c) => (
                <tr key={c.slug}>
                  <td className="py-2 pr-4">
                    <Link href={`/courses/${c.slug}`} className="font-medium text-slate-700 hover:text-accent-600 dark:text-slate-200">
                      {c.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{c.enrollments}</td>
                  <td className="py-2 pr-4">{c.completions}</td>
                  <td className="py-2 pr-4">{c.completionRatePct}%</td>
                  <td className="py-2 pr-4">{c.avgProgressPct}%</td>
                  <td className="py-2 pr-4">{c.avgQuizScore !== null ? `${c.avgQuizScore}%` : '—'}</td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-400">
                    Nessun corso pubblicato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-semibold text-slate-800 dark:text-slate-100">Domande più sbagliate</h2>
        <p className="mb-3 text-xs text-slate-400">
          Calcolate sui tentativi quiz registrati da quando è attivo questo tracciamento.
        </p>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {mostMissed.map((q) => (
            <div key={q.questionId} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="text-slate-700 dark:text-slate-200">{q.prompt}</p>
                <p className="text-xs text-slate-400">{q.quizTitle}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-rose-600 dark:text-rose-400">{q.errorRatePct}% errori</p>
                <p className="text-xs text-slate-400">
                  {q.incorrectAnswers}/{q.totalAnswers} risposte
                </p>
              </div>
            </div>
          ))}
          {mostMissed.length === 0 && (
            <p className="py-4 text-sm text-slate-400">
              Ancora nessuna risposta errata registrata (o nessun tentativo quiz svolto).
            </p>
          )}
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Utenti inattivi</h2>
            <p className="text-xs text-slate-400">Nessun accesso negli ultimi 30 giorni</p>
          </div>
          <ExportCsvButton
            filename="utenti-inattivi.csv"
            rows={inactive.map((u) => ({
              nome: u.fullName,
              email: u.email,
              ultimo_accesso: formatLastActive(u.lastActiveDate),
            }))}
          />
        </div>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {inactive.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">{u.fullName}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <span className="text-slate-500 dark:text-slate-400">Ultimo accesso: {formatLastActive(u.lastActiveDate)}</span>
            </div>
          ))}
          {inactive.length === 0 && <p className="py-4 text-sm text-slate-400">Nessun utente inattivo — ottimo!</p>}
        </div>
      </section>
    </div>
  );
}
