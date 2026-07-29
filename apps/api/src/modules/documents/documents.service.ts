import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(category?: string) {
    return this.prisma.document.findMany({
      where: category ? { category: { slug: category } } : undefined,
      include: { category: true, versions: { where: { isCurrent: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.document.findUniqueOrThrow({
      where: { id },
      include: { category: true, versions: { orderBy: { versionNumber: 'desc' } } },
    });
  }
}
