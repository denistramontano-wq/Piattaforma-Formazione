import { Injectable } from '@nestjs/common';
import {
  AiContentProvider,
  AiContextChunk,
  AiResult,
  ConceptMapNode,
  FlashcardItem,
  GeneratedQuestion,
} from './ai-content-provider.interface';
import { keywordFrequencies, pickSalientWord, rankSentences, splitSentences } from './text-analysis.util';

const NO_COST: AiResult<unknown>['usage'] = { tokensInput: 0, tokensOutput: 0, costUsd: 0 };

@Injectable()
export class LocalFallbackProvider implements AiContentProvider {
  readonly name = 'local';

  async summarize(title: string, text: string): Promise<AiResult<string>> {
    const ranked = rankSentences(text).slice(0, 5);
    const ordered = splitSentences(text).filter((s) => ranked.some((r) => r.sentence === s));
    const summary = ordered.length > 0 ? ordered.join(' ') : text.slice(0, 400);
    return { data: summary, usage: { ...NO_COST }, provider: this.name };
  }

  async generateFlashcards(title: string, text: string): Promise<AiResult<FlashcardItem[]>> {
    const sentences = splitSentences(text);
    const used = new Set<string>();
    const cards: FlashcardItem[] = [];

    for (const sentence of sentences) {
      const term = pickSalientWord(sentence, used);
      if (!term) continue;
      used.add(term.toLowerCase());
      cards.push({ front: term, back: sentence });
      if (cards.length >= 8) break;
    }

    if (cards.length === 0) {
      cards.push({ front: title, back: text.slice(0, 200) });
    }

    return { data: cards, usage: { ...NO_COST }, provider: this.name };
  }

  async generateQuiz(title: string, text: string): Promise<AiResult<GeneratedQuestion[]>> {
    const ranked = rankSentences(text).slice(0, 6);
    const keywords = keywordFrequencies(text, 20).map((k) => k.word);
    const used = new Set<string>();
    const questions: GeneratedQuestion[] = [];

    for (const { sentence } of ranked) {
      const term = pickSalientWord(sentence, used);
      if (!term) continue;
      used.add(term.toLowerCase());

      const blanked = sentence.replace(term, '{{1}}');
      questions.push({
        type: 'FILL_BLANK',
        prompt: `Completa la frase tratta da "${title}".`,
        payload: { text: blanked, blanks: { '1': term } },
        explanation: sentence,
        scoreWeight: 1,
      });

      const distractors = keywords
        .filter((w) => w !== term.toLowerCase())
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

      if (distractors.length === 2) {
        const options = [term, ...distractors].sort(() => 0.5 - Math.random());
        questions.push({
          type: 'MULTIPLE_CHOICE',
          prompt: `Quale termine completa correttamente: "${sentence.replace(term, '____')}"?`,
          payload: {
            options: options.map((o, i) => ({ id: String.fromCharCode(97 + i), text: o })),
            correct: [String.fromCharCode(97 + options.indexOf(term))],
          },
          explanation: sentence,
          scoreWeight: 2,
        });
      }
      if (questions.length >= 8) break;
    }

    return { data: questions, usage: { ...NO_COST }, provider: this.name };
  }

  async generateConceptMap(title: string, text: string): Promise<AiResult<ConceptMapNode>> {
    const sentences = splitSentences(text);
    const topKeywords = keywordFrequencies(text, 6);

    const root: ConceptMapNode = { id: 'root', label: title, children: [] };
    let nodeId = 0;

    for (const { word } of topKeywords) {
      const relatedSentence = sentences.find((s) => s.toLowerCase().includes(word));
      const secondary = relatedSentence
        ? keywordFrequencies(relatedSentence, 3)
            .map((k) => k.word)
            .filter((w) => w !== word)
        : [];

      root.children.push({
        id: `n${nodeId++}`,
        label: capitalize(word),
        children: secondary.map((w) => ({ id: `n${nodeId++}`, label: capitalize(w), children: [] })),
      });
    }

    return { data: root, usage: { ...NO_COST }, provider: this.name };
  }

  async answer(question: string, context: AiContextChunk[]): Promise<AiResult<string>> {
    if (context.length === 0) {
      return {
        data:
          'Non ho trovato informazioni pertinenti nei materiali caricati sulla piattaforma. Prova a riformulare la domanda o contatta un formatore.',
        usage: { ...NO_COST },
        provider: this.name,
      };
    }

    const intro = `In base ai materiali disponibili (modalità senza chiave IA: risposta composta per estrazione, non generata):`;
    const body = context
      .slice(0, 3)
      .map((c) => `**${c.title}** — ${c.snippet.replace(/§§|¤¤/g, '')}`)
      .join('\n\n');

    return { data: `${intro}\n\n${body}`, usage: { ...NO_COST }, provider: this.name };
  }
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
