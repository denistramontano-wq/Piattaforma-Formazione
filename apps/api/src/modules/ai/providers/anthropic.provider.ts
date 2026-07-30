import { Injectable, Logger } from '@nestjs/common';
import {
  AiContentProvider,
  AiContextChunk,
  AiResult,
  ConceptMapNode,
  FlashcardItem,
  GeneratedQuestion,
} from './ai-content-provider.interface';

// Stima indicativa (USD per milione di token) — solo per il monitor di utilizzo admin.
const PRICE_PER_MILLION_INPUT = 3;
const PRICE_PER_MILLION_OUTPUT = 15;

interface ClaudeResponse {
  content: { type: string; text?: string }[];
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Provider reale basato su Anthropic Claude Messages API. Attivo solo se
 * ANTHROPIC_API_KEY è presente nell'ambiente (vedi ai-provider.module.ts).
 * Non è stato possibile testarlo end-to-end in questa sessione (nessuna chiave
 * disponibile) — l'implementazione segue il contratto documentato dell'API.
 */
@Injectable()
export class AnthropicProvider implements AiContentProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly apiKey = process.env.ANTHROPIC_API_KEY!;
  private readonly model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5';

  async summarize(title: string, text: string): Promise<AiResult<string>> {
    const { text: raw, usage } = await this.call(
      'Sei un assistente che scrive riassunti chiari e concisi in italiano per materiali formativi aziendali.',
      `Riassumi in 4-6 frasi il seguente documento intitolato "${title}". Rispondi solo con il testo del riassunto, senza introduzioni.\n\n${truncate(text)}`,
    );
    return { data: raw.trim(), usage, provider: this.name };
  }

  async generateFlashcards(title: string, text: string): Promise<AiResult<FlashcardItem[]>> {
    const { text: raw, usage } = await this.call(
      'Sei un esperto di e-learning che crea flashcard didattiche in italiano. Rispondi SOLO con JSON valido, senza markdown.',
      `Crea da 6 a 10 flashcard (fronte/retro) sui concetti chiave del documento "${title}".
Formato: [{"front": "...", "back": "..."}]\n\n${truncate(text)}`,
    );
    return { data: parseJson<FlashcardItem[]>(raw, []), usage, provider: this.name };
  }

  async generateQuiz(title: string, text: string): Promise<AiResult<GeneratedQuestion[]>> {
    const { text: raw, usage } = await this.call(
      'Sei un esperto di e-learning che crea quiz di verifica in italiano. Rispondi SOLO con JSON valido, senza markdown.',
      `Crea da 4 a 8 domande di verifica (tipo "MULTIPLE_CHOICE" o "FILL_BLANK") sul documento "${title}".
Formato per MULTIPLE_CHOICE: {"type":"MULTIPLE_CHOICE","prompt":"...","payload":{"options":[{"id":"a","text":"..."}],"correct":["a"]},"explanation":"...","scoreWeight":2}
Formato per FILL_BLANK: {"type":"FILL_BLANK","prompt":"...","payload":{"text":"... {{1}} ...","blanks":{"1":"parola"}},"explanation":"...","scoreWeight":1}
Rispondi con un array JSON di domande in questo formato.\n\n${truncate(text)}`,
    );
    return { data: parseJson<GeneratedQuestion[]>(raw, []), usage, provider: this.name };
  }

  async generateConceptMap(title: string, text: string): Promise<AiResult<ConceptMapNode>> {
    const { text: raw, usage } = await this.call(
      'Sei un esperto di didattica che struttura mappe concettuali in italiano. Rispondi SOLO con JSON valido, senza markdown.',
      `Crea una mappa concettuale del documento "${title}" con massimo 2 livelli di profondità.
Formato: {"id":"root","label":"${title}","children":[{"id":"n1","label":"Tema","children":[{"id":"n2","label":"Sottotema","children":[]}]}]}\n\n${truncate(text)}`,
    );
    return {
      data: parseJson<ConceptMapNode>(raw, { id: 'root', label: title, children: [] }),
      usage,
      provider: this.name,
    };
  }

  async answer(question: string, context: AiContextChunk[]): Promise<AiResult<string>> {
    const contextText = context
      .map((c, i) => `[Fonte ${i + 1}: ${c.title}]\n${c.snippet.replace(/§§|¤¤/g, '')}`)
      .join('\n\n');

    const { text: raw, usage } = await this.call(
      `Sei l'assistente virtuale di una piattaforma di formazione. Rispondi ESCLUSIVAMENTE sulla base del
contesto fornito qui sotto, estratto dai materiali ufficiali caricati sulla piattaforma. Se il contesto non
contiene la risposta, dichiara esplicitamente che l'informazione non è presente nei materiali disponibili:
non inventare nulla e non usare conoscenza esterna al contesto. Rispondi in italiano, in modo conciso.`,
      `Contesto:\n${contextText || '(nessun contesto pertinente trovato)'}\n\nDomanda: ${question}`,
    );
    return { data: raw.trim(), usage, provider: this.name };
  }

  private async call(system: string, user: string): Promise<{ text: string; usage: AiResult<unknown>['usage'] }> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Anthropic API error ${res.status}: ${body}`);
      throw new Error(`Chiamata al provider IA fallita (${res.status})`);
    }

    const data = (await res.json()) as ClaudeResponse;
    const text = data.content.find((c) => c.type === 'text')?.text ?? '';
    const costUsd =
      (data.usage.input_tokens / 1_000_000) * PRICE_PER_MILLION_INPUT +
      (data.usage.output_tokens / 1_000_000) * PRICE_PER_MILLION_OUTPUT;

    return {
      text,
      usage: { tokensInput: data.usage.input_tokens, tokensOutput: data.usage.output_tokens, costUsd },
    };
  }
}

function truncate(text: string, maxChars = 12_000) {
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}

function parseJson<T>(raw: string, fallback: T): T {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
