import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { extractPdfText } from '../documents/pdf-extract.util';

export type SearchResultType = 'course' | 'manual' | 'video' | 'quiz' | 'game' | 'faq';
export type SearchQueryMode = 'websearch' | 'or';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  snippet: string | null;
  url: string;
  rank: number;
}

// Marcatori testuali (non HTML) per evidenziare i termini trovati: il frontend li
// trasforma in <mark> senza mai interpretare il resto del testo come markup,
// evitando di dover fidarsi di contenuto HTML generato lato server.
const HEADLINE_OPTIONS = 'StartSel=§§,StopSel=¤¤,MaxWords=30,MinWords=12,MaxFragments=2';

// Stopword compatte (incl. pronomi interrogativi) usate solo per costruire la query
// "OR" a parole chiave impiegata dal recupero RAG dell'assistente — non influisce
// sulla ricerca a catalogo, che resta sull'operatore AND di websearch_to_tsquery.
const QUESTION_STOPWORDS = new Set(
  `cosa come quando dove perché quale quali quanto chi che cui devo posso puoi
   può voglio vorrei dimmi dammi dire spiega spiegami per con del dello della
   dei degli delle nel nello nella nei negli nelle sul sullo sulla sui sugli
   sulle dal dallo dalla dai dagli dalle un uno una il lo la i gli le e o ma
   se non sono è sei siamo siete essere avere ho hai ha abbiamo avete hanno`
    .split(/\s+/)
    .filter(Boolean),
);

interface RawRow {
  id: string;
  slug?: string;
  title: string;
  snippet: string | null;
  rank: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    rawQuery: string,
    type?: SearchResultType,
    mode: SearchQueryMode = 'websearch',
  ): Promise<{ query: string; total: number; results: SearchResult[] }> {
    const query = rawQuery.trim();
    if (!query) return { query, total: 0, results: [] };

    const tsQuery = this.buildTsQueryFragment(query, mode);

    const tasks: Promise<SearchResult[]>[] = [];
    if (!type || type === 'course') tasks.push(this.searchCourses(query, tsQuery));
    if (!type || type === 'manual') tasks.push(this.searchManuals(query, tsQuery));
    if (!type || type === 'video') tasks.push(this.searchVideos(query, tsQuery));
    if (!type || type === 'quiz') tasks.push(this.searchQuizzes(query, tsQuery));
    if (!type || type === 'game') tasks.push(this.searchGames(query, tsQuery));
    if (!type || type === 'faq') tasks.push(this.searchFaqs(query, tsQuery));

    const grouped = await Promise.all(tasks);
    const results = grouped.flat().sort((a, b) => b.rank - a.rank);
    return { query, total: results.length, results };
  }

  async suggest(rawQuery: string): Promise<{ type: SearchResultType; title: string; url: string }[]> {
    const query = rawQuery.trim();
    if (!query) return [];

    const [courses, manuals, videos, quizzes, games, faqs] = await Promise.all([
      this.prisma.course.findMany({
        where: { status: 'PUBLISHED', title: { contains: query, mode: 'insensitive' } },
        take: 3,
        select: { title: true, slug: true },
      }),
      this.prisma.document.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: 3,
        select: { id: true, title: true },
      }),
      this.prisma.video.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: 2,
        select: { id: true, title: true },
      }),
      this.prisma.quiz.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: 2,
        select: { id: true, title: true },
      }),
      this.prisma.miniGame.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: 2,
        select: { id: true, title: true },
      }),
      this.prisma.faq.findMany({
        where: { question: { contains: query, mode: 'insensitive' } },
        take: 2,
        select: { id: true, question: true },
      }),
    ]);

    return [
      ...courses.map((c) => ({ type: 'course' as const, title: c.title, url: `/courses/${c.slug}` })),
      ...manuals.map((d) => ({ type: 'manual' as const, title: d.title, url: `/manuals/${d.id}` })),
      ...videos.map((v) => ({ type: 'video' as const, title: v.title, url: `/videos/${v.id}` })),
      ...quizzes.map((q) => ({ type: 'quiz' as const, title: q.title, url: `/quizzes/${q.id}` })),
      ...games.map((g) => ({ type: 'game' as const, title: g.title, url: `/games/${g.id}` })),
      ...faqs.map((f) => ({ type: 'faq' as const, title: f.question, url: `/faq` })),
    ].slice(0, 8);
  }

  /**
   * In modalità "websearch" usa l'operatore nativo di PostgreSQL (AND implicito tra
   * i termini, adatto a query brevi da barra di ricerca). In modalità "or" — usata dal
   * recupero RAG dell'assistente (docs/06 §6.3) — le domande in linguaggio naturale
   * hanno troppe parole perché l'AND trovi qualcosa: estraiamo le parole chiave
   * significative e le uniamo con OR.
   */
  private buildTsQueryFragment(query: string, mode: SearchQueryMode) {
    if (mode === 'or') {
      const orQuery = toOrTsQuery(query);
      if (orQuery) return Prisma.sql`to_tsquery('italian', ${orQuery})`;
    }
    return Prisma.sql`websearch_to_tsquery('italian', ${query})`;
  }

  private async searchCourses(query: string, tsQuery: Prisma.Sql): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, slug, title,
        ts_headline('italian', coalesce(description, ''), ${tsQuery}, ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', title || ' ' || coalesce(description, '')), ${tsQuery}) as rank
      FROM "Course"
      WHERE status = 'PUBLISHED'
        AND to_tsvector('italian', title || ' ' || coalesce(description, '')) @@ ${tsQuery}
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('course', r, `/courses/${r.slug}`));
  }

  private async searchManuals(query: string, tsQuery: Prisma.Sql): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT d.id as id, d.title as title,
        ts_headline('italian', coalesce(dv."extractedText", d.description, ''), ${tsQuery}, ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(
          to_tsvector('italian', d.title || ' ' || coalesce(d.description, '') || ' ' || coalesce(dv."extractedText", '')),
          ${tsQuery}
        ) as rank
      FROM "Document" d
      JOIN "DocumentVersion" dv ON dv."documentId" = d.id AND dv."isCurrent" = true
      WHERE to_tsvector('italian', d.title || ' ' || coalesce(d.description, '') || ' ' || coalesce(dv."extractedText", ''))
        @@ ${tsQuery}
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('manual', r, `/manuals/${r.id}`));
  }

  private async searchVideos(query: string, tsQuery: Prisma.Sql): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, title,
        ts_headline('italian', coalesce(description, ''), ${tsQuery}, ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', title || ' ' || coalesce(description, '')), ${tsQuery}) as rank
      FROM "Video"
      WHERE to_tsvector('italian', title || ' ' || coalesce(description, '')) @@ ${tsQuery}
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('video', r, `/videos/${r.id}`));
  }

  private async searchQuizzes(query: string, tsQuery: Prisma.Sql): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, title,
        ts_headline('italian', coalesce(description, ''), ${tsQuery}, ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', title || ' ' || coalesce(description, '')), ${tsQuery}) as rank
      FROM "Quiz"
      WHERE to_tsvector('italian', title || ' ' || coalesce(description, '')) @@ ${tsQuery}
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('quiz', r, `/quizzes/${r.id}`));
  }

  private async searchGames(query: string, tsQuery: Prisma.Sql): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, title,
        ts_headline('italian', coalesce(description, ''), ${tsQuery}, ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', title || ' ' || coalesce(description, '')), ${tsQuery}) as rank
      FROM "MiniGame"
      WHERE to_tsvector('italian', title || ' ' || coalesce(description, '')) @@ ${tsQuery}
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('game', r, `/games/${r.id}`));
  }

  private async searchFaqs(query: string, tsQuery: Prisma.Sql): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, question as title,
        ts_headline('italian', answer, ${tsQuery}, ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', question || ' ' || answer), ${tsQuery}) as rank
      FROM "Faq"
      WHERE to_tsvector('italian', question || ' ' || answer) @@ ${tsQuery}
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('faq', r, `/faq`));
  }

  private toResult(type: SearchResultType, row: RawRow, url: string): SearchResult {
    return { type, id: row.id, title: row.title, snippet: row.snippet, url, rank: Number(row.rank) };
  }

  /**
   * Ricalcola il testo estratto per tutte le versioni correnti dei manuali
   * (es. dopo aver caricato manualmente un file sul filesystem, o per recuperare
   * documenti caricati prima che l'estrazione fosse collegata al flusso di upload).
   */
  async reindexManuals() {
    const versions = await this.prisma.documentVersion.findMany({ where: { isCurrent: true } });
    let updated = 0;
    for (const version of versions) {
      const text = await extractPdfText(version.fileUrl);
      if (text) {
        await this.prisma.documentVersion.update({ where: { id: version.id }, data: { extractedText: text } });
        updated++;
      }
    }
    return { processed: versions.length, updated };
  }
}

function toOrTsQuery(query: string): string | null {
  const words = (query.toLowerCase().match(/[a-zà-ù]+/g) ?? []).filter(
    (w) => w.length >= 3 && !QUESTION_STOPWORDS.has(w),
  );
  const unique = [...new Set(words)];
  return unique.length > 0 ? unique.join(' | ') : null;
}
