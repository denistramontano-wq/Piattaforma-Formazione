import { api } from '@/lib/api';
import type { MiniGame } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FlashcardGame } from '@/components/games/FlashcardGame';
import { MemoryGame } from '@/components/games/MemoryGame';

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await api.get<MiniGame>(`/games/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Mini giochi', href: '/games' }, { label: game.title }]} />
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{game.title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{game.description}</p>
      </div>

      {game.type === 'FLASHCARD' && <FlashcardGame gameId={game.id} cards={game.config.cards} />}
      {game.type === 'MEMORY' && <MemoryGame gameId={game.id} pairs={game.config.pairs} />}
      {game.type !== 'FLASHCARD' && game.type !== 'MEMORY' && (
        <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
          Questa tipologia di mini gioco ({game.type}) è pianificata per la versione 1.0 — vedi docs/05-gamification.md.
        </div>
      )}
    </div>
  );
}
