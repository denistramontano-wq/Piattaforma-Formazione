import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import type { CurrentUser } from '@/lib/types';

/**
 * Le pagine sotto /admin sono Server Component che chiamano direttamente le API
 * protette da @Roles('ADMIN'): senza questo controllo, un utente non amministratore
 * che apre l'URL vedrebbe la pagina di errore grezza di Next.js invece di un rimando
 * pulito (il middleware verifica solo la presenza del cookie, non il ruolo).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await api.get<CurrentUser>('/me').catch(() => null);

  if (!me) {
    redirect('/login');
  }
  if (me.role !== 'ADMIN') {
    redirect('/');
  }

  return <>{children}</>;
}
