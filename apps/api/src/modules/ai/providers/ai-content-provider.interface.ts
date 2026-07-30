export interface FlashcardItem {
  front: string;
  back: string;
}

export interface GeneratedQuestion {
  type: 'MULTIPLE_CHOICE' | 'FILL_BLANK';
  prompt: string;
  payload: Record<string, unknown>;
  explanation: string;
  scoreWeight: number;
}

export interface ConceptMapNode {
  id: string;
  label: string;
  children: ConceptMapNode[];
}

export interface AiUsage {
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
}

export interface AiResult<T> {
  data: T;
  usage: AiUsage;
  provider: string;
}

export interface AiContextChunk {
  title: string;
  snippet: string;
  url: string;
}

export const AI_CONTENT_PROVIDER = Symbol('AI_CONTENT_PROVIDER');

/**
 * Contratto comune tra il provider reale (Anthropic Claude) e il fallback
 * locale usato quando nessuna chiave API è configurata (docs/06 — l'IA
 * "propone", l'admin approva sempre prima della pubblicazione).
 */
export interface AiContentProvider {
  readonly name: string;
  summarize(title: string, text: string): Promise<AiResult<string>>;
  generateFlashcards(title: string, text: string): Promise<AiResult<FlashcardItem[]>>;
  generateQuiz(title: string, text: string): Promise<AiResult<GeneratedQuestion[]>>;
  generateConceptMap(title: string, text: string): Promise<AiResult<ConceptMapNode>>;
  answer(question: string, context: AiContextChunk[]): Promise<AiResult<string>>;
}
