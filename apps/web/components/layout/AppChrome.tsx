'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AssistantWidget } from '../assistant/AssistantWidget';

const NO_CHROME_PATHS = ['/login', '/certificates/verify'];

/**
 * Il login e la verifica pubblica di un certificato non hanno la barra laterale/header
 * dell'app né l'assistente: la verifica in particolare è pensata per essere aperta da chi
 * non ha (e non deve avere) un account sulla piattaforma, es. un datore di lavoro.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (NO_CHROME_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
      <AssistantWidget />
    </>
  );
}
