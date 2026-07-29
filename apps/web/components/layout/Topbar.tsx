'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function Topbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      // La ricerca federata multi-tipo (docs/03-sistema-ricerca.md) è prevista per la v1.0.
      // Per ora la barra reindirizza al catalogo corsi filtrato.
      router.push(`/courses?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <Link href="/" className="shrink-0 text-lg font-semibold text-accent-600 dark:text-accent-400">
        Piattaforma Formazione
      </Link>
      <form onSubmit={handleSearch} className="flex-1">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca corsi, manuali, video, FAQ… (⌘K)"
          className="w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </form>
      <button
        type="button"
        aria-label="Notifiche"
        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        🔔
      </button>
      <ThemeToggle />
      <Link
        href="/profile"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold text-white"
        aria-label="Profilo utente"
      >
        MR
      </Link>
    </header>
  );
}
