import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import type { CurrentUser } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default async function ProfilePage() {
  const user = await api.get<CurrentUser>('/me');

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
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Gamification</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Livello {user.level}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{user.totalXp} XP totali</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{user.badgeCount} badge ottenuti</p>
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
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
