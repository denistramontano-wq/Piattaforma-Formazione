import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import type { CurrentUser, MyGamification } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

const ACTION_LABELS: Record<string, string> = {
  LESSON_COMPLETED: 'Lezione completata',
  COURSE_COMPLETED: 'Corso completato',
  QUIZ_PASSED: 'Quiz superato',
  GAME_COMPLETED: 'Mini gioco completato',
  DAILY_STREAK: 'Accesso giornaliero',
};

export default async function ProfilePage() {
  const [user, gamification] = await Promise.all([
    api.get<CurrentUser>('/me'),
    api.get<MyGamification>('/me/gamification'),
  ]);

  async function updateProfile(formData: FormData) {
    'use server';
    await api.put('/me', { fullName: formData.get('fullName') });
    revalidatePath('/profile');
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Profilo utente' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Profilo utente</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <form action={updateProfile} className="card flex flex-col gap-4 p-6 lg:col-span-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Dati anagrafici</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Nome completo</span>
            <input
              name="fullName"
              defaultValue={user.fullName}
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Email</span>
            <input
              value={user.email}
              disabled
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50"
            />
          </label>
          <button type="submit" className="btn-primary w-fit">
            Salva modifiche
          </button>
        </form>

        <aside className="card flex flex-col gap-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Gamification</h2>
            <Link href="/leaderboard" className="text-xs font-medium text-accent-600 hover:underline dark:text-accent-400">
              Classifica →
            </Link>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Livello {gamification.level} — {gamification.levelName}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-accent-500"
                style={{ width: `${gamification.progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {gamification.totalXp} XP
              {gamification.nextLevelXp !== null
                ? ` — ${gamification.nextLevelXp - gamification.totalXp} XP al prossimo livello`
                : ' — livello massimo raggiunto'}
            </p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            🔥 {gamification.currentStreak} {gamification.currentStreak === 1 ? 'giorno' : 'giorni'} di fila
            {gamification.longestStreak > gamification.currentStreak && (
              <span className="text-slate-400"> (record: {gamification.longestStreak})</span>
            )}
          </p>

          <div className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Badge ({gamification.badges.filter((b) => b.earned).length}/{gamification.badges.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {gamification.badges.map((b) => (
                <div
                  key={b.id}
                  title={b.description ?? undefined}
                  className={`rounded-lg border p-2 text-center text-xs ${
                    b.earned
                      ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
                  }`}
                >
                  <span className="block text-lg">{b.earned ? '🏅' : '🔒'}</span>
                  {b.name}
                </div>
              ))}
            </div>
          </div>

          {gamification.recentActivity.length > 0 && (
            <div className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Attività recente</p>
              <ul className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                {gamification.recentActivity.slice(0, 8).map((e, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{ACTION_LABELS[e.action] ?? e.action}</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">+{e.points} XP</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Sicurezza</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autenticazione SSO/MFA pianificata (docs/09-architettura-tecnica.md).
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
