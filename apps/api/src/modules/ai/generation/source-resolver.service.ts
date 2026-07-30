import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { extractPdfText } from '../../documents/pdf-extract.util';

export interface AiSource {
  sourceType: 'DOCUMENT' | 'LESSON';
  sourceId: string;
  title: string;
  text: string;
}

export interface AiSourceOption {
  sourceType: 'DOCUMENT' | 'LESSON';
  sourceId: string;
  title: string;
  context: string;
}

@Injectable()
export class SourceResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(sourceType: 'DOCUMENT' | 'LESSON', sourceId: string): Promise<AiSource> {
    if (sourceType === 'DOCUMENT') {
      const doc = await this.prisma.document.findUnique({
        where: { id: sourceId },
        include: { versions: { where: { isCurrent: true } } },
      });
      if (!doc) throw new NotFoundException('Manuale non trovato');
      const text = doc.versions[0]?.extractedText || doc.description || '';
      if (!text.trim()) {
        throw new BadRequestException(
          'Nessun testo disponibile per questo manuale (PDF senza layer di testo o descrizione vuota).',
        );
      }
      return { sourceType, sourceId, title: doc.title, text };
    }

    const lesson = await this.prisma.lesson.findUnique({ where: { id: sourceId } });
    if (!lesson) throw new NotFoundException('Lezione non trovata');

    if (lesson.contentType === 'TEXT') {
      const text = lesson.contentBody ?? '';
      if (!text.trim()) throw new BadRequestException('La lezione non ha contenuto testuale.');
      return { sourceType, sourceId, title: lesson.title, text };
    }

    if (lesson.contentType === 'PDF' && lesson.contentBody) {
      const text = await extractPdfText(lesson.contentBody);
      if (!text) throw new BadRequestException('Impossibile estrarre testo dal PDF della lezione.');
      return { sourceType, sourceId, title: lesson.title, text };
    }

    throw new BadRequestException(
      'Generazione non disponibile per lezioni video senza trascrizione (docs/06 §6.9).',
    );
  }

  async listOptions(): Promise<AiSourceOption[]> {
    const [documents, lessons] = await Promise.all([
      this.prisma.document.findMany({
        include: { versions: { where: { isCurrent: true } } },
        orderBy: { title: 'asc' },
      }),
      this.prisma.lesson.findMany({
        where: { contentType: { in: ['TEXT', 'PDF'] } },
        include: { module: { include: { course: true } } },
        orderBy: { title: 'asc' },
      }),
    ]);

    const documentOptions: AiSourceOption[] = documents
      .filter((d) => (d.versions[0]?.extractedText || d.description || '').trim().length > 0)
      .map((d) => ({ sourceType: 'DOCUMENT', sourceId: d.id, title: d.title, context: 'Manuale' }));

    const lessonOptions: AiSourceOption[] = lessons.map((l) => ({
      sourceType: 'LESSON',
      sourceId: l.id,
      title: l.title,
      context: `Lezione — ${l.module.course.title}`,
    }));

    return [...documentOptions, ...lessonOptions];
  }
}
