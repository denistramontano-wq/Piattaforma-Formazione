import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { HomeHighlights } from '@/lib/types';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function HomePage() {
  const data = await api.get<HomeHighlights>('/home/highlights');

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Ciao{data.userFullName ? `, ${data.userFullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Ecco i corsi consigliati e da dove hai lasciato la formazione.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Riprendi da dove eri</h2>
          <Link href="/dashboard" className="text-sm text-accent-600 hover:underline dark:text-accent-400">
            Vai alla dashboard
          </Link>
        </div>
        {data.continueLearning.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="Nessun corso in corso"
            description="Esplora il catalogo e iscriviti al tuo primo corso per iniziare."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.continueLearning.map((c) => (
              <Link key={c.slug} href={`/courses/${c.slug}`} className="card flex items-center gap-3 p-4 hover:shadow-md">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {c.coverUrl && <Image src={c.coverUrl} alt="" fill className="object-cover" sizes="80px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{c.title}</p>
                  <div className="mt-1">
                    <ProgressBar value={c.progressPct} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Corsi in evidenza</h2>
          <Link href="/courses" className="text-sm text-accent-600 hover:underline dark:text-accent-400">
            Vedi tutto il catalogo
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.featured.map((c) => (
            <Link key={c.slug} href={`/courses/${c.slug}`} className="card overflow-hidden hover:shadow-md">
              <div className="relative h-32 w-full bg-slate-100 dark:bg-slate-800">
                {c.coverUrl && <Image src={c.coverUrl} alt="" fill className="object-cover" sizes="320px" />}
              </div>
              <div className="flex flex-col gap-2 p-4">
                <LevelBadge level={c.level} />
                <p className="font-medium text-slate-800 dark:text-slate-100">{c.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{c.estimatedMinutes} minuti stimati</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
