'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/courses', label: 'Catalogo corsi', icon: '📚' },
  { href: '/categories', label: 'Categorie', icon: '🗂️' },
  { href: '/manuals', label: 'Manuali', icon: '📄' },
  { href: '/videos', label: 'Video', icon: '🎬' },
  { href: '/quizzes', label: 'Quiz', icon: '❓' },
  { href: '/games', label: 'Mini giochi', icon: '🎮' },
  { href: '/downloads', label: 'Download', icon: '⬇️' },
  { href: '/faq', label: 'FAQ', icon: '💬' },
  { href: '/progress', label: 'Progressi', icon: '📈' },
  { href: '/certificates', label: 'Certificati', icon: '🏅' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-900 md:block">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
        <Link
          href="/admin"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname.startsWith('/admin')
              ? 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <span aria-hidden>🛠️</span>
          Dashboard amministratore
        </Link>
      </nav>
    </aside>
  );
}
