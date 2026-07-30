import Link from 'next/link';
import { api } from '@/lib/api';
import type { SearchResponse, SearchResultType } from '@/lib/types';
import { SEARCH_TYPE_META, SEARCH_TYPE_ORDER } from '@/lib/search-types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { Highlight } from '@/components/ui/Highlight';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: SearchResultType }>;
}) {
  const { q = '', type } = await searchParams;
  const data = q.trim() ? await api.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}`) : { query: q, total: 0, results: [] };

  const counts = SEARCH_TYPE_ORDER.reduce<Record<SearchResultType, number>>(
    (acc, t) => {
      acc[t] = data.results.filter((r) => r.type === t).length;
      return acc;
    },
    {} as Record<SearchResultType, number>,
  );

  const results = type ? data.results.filter((r) => r.type === type) : data.results;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Ricerca' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {q ? (
          <>
            Risultati per &ldquo;{q}&rdquo; <span className="text-base font-normal text-slate-400">({data.total})</span>
          </>
        ) : (
          'Cerca nella piattaforma'
        )}
      </h1>

      {q && (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <TabLink q={q} label={`Tutti (${data.total})`} active={!type} />
          {SEARCH_TYPE_ORDER.map((t) => (
            <TabLink
              key={t}
              q={q}
              type={t}
              label={`${SEARCH_TYPE_META[t].icon} ${SEARCH_TYPE_META[t].labelPlural} (${counts[t]})`}
              active={type === t}
            />
          ))}
        </div>
      )}

      {!q && (
        <EmptyState
          icon="🔍"
          title="Digita un termine nella barra di ricerca in alto"
          description="La ricerca è federata su corsi, manuali (anche nel testo dei PDF), video, quiz, mini giochi e FAQ."
        />
      )}

      {q && results.length === 0 && (
        <EmptyState title="Nessun risultato trovato" description="Prova con termini diversi o più generici." />
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <Link key={`${r.type}-${r.id}`} href={r.url} className="card block p-4 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <span aria-hidden>{SEARCH_TYPE_META[r.type].icon}</span>
                <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {SEARCH_TYPE_META[r.type].label}
                </span>
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{r.title}</p>
              {r.snippet && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  <Highlight text={r.snippet} />
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TabLink({
  q,
  type,
  label,
  active,
}: {
  q: string;
  type?: SearchResultType;
  label: string;
  active: boolean;
}) {
  const href = `/search?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}`;
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-accent-500 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </Link>
  );
}
