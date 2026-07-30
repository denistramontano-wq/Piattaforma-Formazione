import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { extractPdfText } from '../documents/pdf-extract.util';

export type SearchResultType = 'course' | 'manual' | 'video' | 'quiz' | 'game' | 'faq';

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

  async search(rawQuery: string, type?: SearchResultType): Promise<{ query: string; total: number; results: SearchResult[] }> {
    const query = rawQuery.trim();
    if (!query) return { query, total: 0, results: [] };

    const tasks: Promise<SearchResult[]>[] = [];
    if (!type || type === 'course') tasks.push(this.searchCourses(query));
    if (!type || type === 'manual') tasks.push(this.searchManuals(query));
    if (!type || type === 'video') tasks.push(this.searchVideos(query));
    if (!type || type === 'quiz') tasks.push(this.searchQuizzes(query));
    if (!type || type === 'game') tasks.push(this.searchGames(query));
    if (!type || type === 'faq') tasks.push(this.searchFaqs(query));

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

  private async searchCourses(query: string): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, slug, title,
        ts_headline('italian', coalesce(description, ''), websearch_to_tsquery('italian', ${query}), ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', title || ' ' || coalesce(description, '')), websearch_to_tsquery('italian', ${query})) as rank
      FROM "Course"
      WHERE status = 'PUBLISHED'
        AND to_tsvector('italian', title || ' ' || coalesce(description, '')) @@ websearch_to_tsquery('italian', ${query})
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('course', r, `/courses/${r.slug}`));
  }

  private async searchManuals(query: string): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT d.id as id, d.title as title,
        ts_headline('italian', coalesce(dv."extractedText", d.description, ''), websearch_to_tsquery('italian', ${query}), ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(
          to_tsvector('italian', d.title || ' ' || coalesce(d.description, '') || ' ' || coalesce(dv."extractedText", '')),
          websearch_to_tsquery('italian', ${query})
        ) as rank
      FROM "Document" d
      JOIN "DocumentVersion" dv ON dv."documentId" = d.id AND dv."isCurrent" = true
      WHERE to_tsvector('italian', d.title || ' ' || coalesce(d.description, '') || ' ' || coalesce(dv."extractedText", ''))
        @@ websearch_to_tsquery('italian', ${query})
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('manual', r, `/manuals/${r.id}`));
  }

  private async searchVideos(query: string): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, title,
        ts_headline('italian', coalesce(description, ''), websearch_to_tsquery('italian', ${query}), ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', title || ' ' || coalesce(description, '')), websearch_to_tsquery('italian', ${query})) as rank
      FROM "Video"
      WHERE to_tsvector('italian', title || ' ' || coalesce(description, '')) @@ websearch_to_tsquery('italian', ${query})
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('video', r, `/videos/${r.id}`));
  }

  private async searchQuizzes(query: string): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, title,
        ts_headline('italian', coalesce(description, ''), websearch_to_tsquery('italian', ${query}), ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', title || ' ' || coalesce(description, '')), websearch_to_tsquery('italian', ${query})) as rank
      FROM "Quiz"
      WHERE to_tsvector('italian', title || ' ' || coalesce(description, '')) @@ websearch_to_tsquery('italian', ${query})
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('quiz', r, `/quizzes/${r.id}`));
  }

  private async searchGames(query: string): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, title,
        ts_headline('italian', coalesce(description, ''), websearch_to_tsquery('italian', ${query}), ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', title || ' ' || coalesce(description, '')), websearch_to_tsquery('italian', ${query})) as rank
      FROM "MiniGame"
      WHERE to_tsvector('italian', title || ' ' || coalesce(description, '')) @@ websearch_to_tsquery('italian', ${query})
      ORDER BY rank DESC
      LIMIT 20
    `;
    return rows.map((r) => this.toResult('game', r, `/games/${r.id}`));
  }

  private async searchFaqs(query: string): Promise<SearchResult[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT id, question as title,
        ts_headline('italian', answer, websearch_to_tsquery('italian', ${query}), ${HEADLINE_OPTIONS}) as snippet,
        ts_rank(to_tsvector('italian', question || ' ' || answer), websearch_to_tsquery('italian', ${query})) as rank
      FROM "Faq"
      WHERE to_tsvector('italian', question || ' ' || answer) @@ websearch_to_tsquery('italian', ${query})
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
