import Link from 'next/link';
import { api } from '@/lib/api';
import type { MiniGame } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { LevelBadge } from '@/components/ui/LevelBadge';
import { EmptyState } from '@/components/ui/EmptyState';

const TYPE_ICON: Record<string, string> = {
  FLASHCARD: '🗂️',
  MEMORY: '🧠',
  DRAG_DROP: '🧩',
  PUZZLE: '🧩',
  TIMED_QUIZ: '⏱️',
  ESCAPE_ROOM: '🔐',
  FIND_ERROR: '🔍',
  IMAGE_MATCH: '🖼️',
};

export default async function GamesPage() {
  const games = await api.get<MiniGame[]>('/games');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Mini giochi' }]} />
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Centro mini giochi</h1>

      {games.length === 0 ? (
        <EmptyState title="Nessun mini gioco disponibile" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`} className="card flex flex-col gap-2 p-4 hover:shadow-md">
              <span className="text-2xl" aria-hidden>
                {TYPE_ICON[game.type] ?? '🎮'}
              </span>
              <LevelBadge level={game.difficulty} />
              <p className="font-medium text-slate-800 dark:text-slate-100">{game.title}</p>
              <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{game.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
