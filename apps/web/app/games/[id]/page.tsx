import { api } from '@/lib/api';
import type { MiniGame } from '@/lib/types';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FlashcardGame } from '@/components/games/FlashcardGame';
import { MemoryGame } from '@/components/games/MemoryGame';
import { DragDropGame } from '@/components/games/DragDropGame';
import { PuzzleGame } from '@/components/games/PuzzleGame';
import { TimedQuizGame } from '@/components/games/TimedQuizGame';
import { EscapeRoomGame } from '@/components/games/EscapeRoomGame';
import { FindErrorGame } from '@/components/games/FindErrorGame';
import { ImageMatchGame } from '@/components/games/ImageMatchGame';

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
      {game.type === 'DRAG_DROP' && (
        <DragDropGame
          gameId={game.id}
          items={game.config.items}
          zones={game.config.zones}
          correctMap={game.config.correctMap}
        />
      )}
      {game.type === 'PUZZLE' && <PuzzleGame gameId={game.id} sentence={game.config.sentence} />}
      {game.type === 'TIMED_QUIZ' && (
        <TimedQuizGame
          gameId={game.id}
          timeLimitSeconds={game.config.timeLimitSeconds}
          questions={game.config.questions}
        />
      )}
      {game.type === 'ESCAPE_ROOM' && (
        <EscapeRoomGame gameId={game.id} intro={game.config.intro} steps={game.config.steps} />
      )}
      {game.type === 'FIND_ERROR' && (
        <FindErrorGame
          gameId={game.id}
          tokens={game.config.tokens}
          errorIndexes={game.config.errorIndexes}
          explanations={game.config.explanations}
        />
      )}
      {game.type === 'IMAGE_MATCH' && <ImageMatchGame gameId={game.id} pairs={game.config.pairs} />}
    </div>
  );
}
