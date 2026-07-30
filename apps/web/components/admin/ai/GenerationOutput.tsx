import type { AiGeneration, ConceptMapNode, FlashcardItem, GeneratedQuestion } from '@/lib/types';
import { ConceptMapView } from './ConceptMapView';

export function GenerationOutput({ generation }: { generation: AiGeneration }) {
  switch (generation.generationType) {
    case 'SUMMARY':
      return <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">{generation.output as string}</p>;

    case 'FLASHCARDS': {
      const cards = generation.output as FlashcardItem[];
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((c, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <p className="font-medium text-slate-800 dark:text-slate-100">{c.front}</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">{c.back}</p>
            </div>
          ))}
          {cards.length === 0 && <p className="text-sm text-slate-400">Nessuna flashcard generata.</p>}
        </div>
      );
    }

    case 'QUIZ': {
      const questions = generation.output as GeneratedQuestion[];
      return (
        <div className="flex flex-col gap-3">
          {questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="mb-1 flex items-center gap-2">
                <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{q.type}</span>
                <span className="text-xs text-slate-400">{q.scoreWeight} pt</span>
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{q.prompt}</p>
              {q.type === 'MULTIPLE_CHOICE' && (
                <ul className="mt-1 list-disc pl-5 text-slate-600 dark:text-slate-300">
                  {q.payload.options.map((o: { id: string; text: string }) => (
                    <li key={o.id} className={q.payload.correct.includes(o.id) ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}>
                      {o.text}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === 'FILL_BLANK' && (
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {q.payload.text} <span className="text-xs text-slate-400">(risposta: {Object.values(q.payload.blanks).join(', ')})</span>
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">{q.explanation}</p>
            </div>
          ))}
          {questions.length === 0 && <p className="text-sm text-slate-400">Nessuna domanda generata.</p>}
        </div>
      );
    }

    case 'CONCEPT_MAP':
      return <ConceptMapView node={generation.output as ConceptMapNode} />;

    default:
      return null;
  }
}
