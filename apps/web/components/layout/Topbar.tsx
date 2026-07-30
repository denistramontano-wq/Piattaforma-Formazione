'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { SuggestItem } from '@/lib/types';
import { SEARCH_TYPE_META } from '@/lib/search-types';
import { ThemeToggle } from './ThemeToggle';

export function Topbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .get<SuggestItem[]>(`/search/suggest?q=${encodeURIComponent(trimmed)}`)
        .then((results) => {
          setSuggestions(results);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goToResults() {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      router.push(suggestions[activeIndex].url);
      setOpen(false);
    } else {
      goToResults();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <Link href="/" className="shrink-0 text-lg font-semibold text-accent-600 dark:text-accent-400">
        Piattaforma Formazione
      </Link>
      <div ref={containerRef} className="relative flex-1 max-w-xl">
        <form onSubmit={handleSubmit}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Cerca corsi, manuali, video, quiz, FAQ…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </form>
        {open && suggestions.length > 0 && (
          <div className="card absolute left-0 right-0 top-full z-20 mt-1 max-h-96 overflow-y-auto py-1">
            {suggestions.map((s, i) => (
              <Link
                key={`${s.type}-${s.title}-${i}`}
                href={s.url}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm ${
                  i === activeIndex ? 'bg-accent-50 dark:bg-accent-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span aria-hidden>{SEARCH_TYPE_META[s.type].icon}</span>
                <span className="flex-1 truncate text-slate-700 dark:text-slate-200">{s.title}</span>
                <span className="shrink-0 text-xs text-slate-400">{SEARCH_TYPE_META[s.type].label}</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={goToResults}
              className="mt-1 w-full border-t border-slate-100 px-3 py-2 text-left text-sm text-accent-600 hover:bg-slate-50 dark:border-slate-800 dark:text-accent-400 dark:hover:bg-slate-800"
            >
              Vedi tutti i risultati per &ldquo;{query}&rdquo;
            </button>
          </div>
        )}
      </div>
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
