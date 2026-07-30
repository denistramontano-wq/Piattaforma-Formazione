import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { extractPdfText } from './pdf-extract.util';

interface DocumentMeta {
  title: string;
  description?: string;
  author?: string;
  categoryId?: string | null;
  level?: 'BASE' | 'INTERMEDIO' | 'AVANZATO';
  estimatedMinutes?: number;
}

@Injectable()
export class AdminDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.document.findMany({
      orderBy: { title: 'asc' },
      include: { category: true, versions: { orderBy: { versionNumber: 'desc' } } },
    });
  }

  async create(meta: DocumentMeta, fileUrl: string) {
    const extractedText = await extractPdfText(fileUrl);
    return this.prisma.document.create({
      data: {
        title: meta.title,
        description: meta.description,
        author: meta.author,
        categoryId: meta.categoryId || null,
        level: meta.level ?? 'BASE',
        estimatedMinutes: meta.estimatedMinutes ?? 15,
        versions: { create: [{ versionNumber: 1, fileUrl, isCurrent: true, extractedText }] },
      },
      include: { versions: true },
    });
  }

  update(id: string, meta: Partial<DocumentMeta>) {
    return this.prisma.document.update({
      where: { id },
      data: {
        title: meta.title,
        description: meta.description,
        author: meta.author,
        categoryId: meta.categoryId === undefined ? undefined : meta.categoryId || null,
        level: meta.level,
        estimatedMinutes: meta.estimatedMinutes,
      },
    });
  }

  async addVersion(documentId: string, fileUrl: string, changelog?: string) {
    const [last, extractedText] = await Promise.all([
      this.prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { versionNumber: 'desc' },
      }),
      extractPdfText(fileUrl),
    ]);
    const nextVersion = (last?.versionNumber ?? 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      await tx.documentVersion.updateMany({ where: { documentId }, data: { isCurrent: false } });
      return tx.documentVersion.create({
        data: { documentId, versionNumber: nextVersion, fileUrl, changelog, isCurrent: true, extractedText },
      });
    });
  }

  remove(id: string) {
    return this.prisma.document.delete({ where: { id } });
  }
}
