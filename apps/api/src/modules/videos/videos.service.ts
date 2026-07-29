import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(category?: string) {
    return this.prisma.video.findMany({
      where: category ? { category: { slug: category } } : undefined,
      include: { category: true },
    });
  }

  findOne(id: string) {
    return this.prisma.video.findUniqueOrThrow({ where: { id }, include: { category: true } });
  }
}
