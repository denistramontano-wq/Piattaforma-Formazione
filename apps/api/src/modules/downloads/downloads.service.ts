import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DownloadsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(fileType?: string, category?: string) {
    return this.prisma.downloadFile.findMany({
      where: {
        fileType: (fileType as any) || undefined,
        category: category ? { slug: category } : undefined,
      },
      include: { category: true },
    });
  }
}
