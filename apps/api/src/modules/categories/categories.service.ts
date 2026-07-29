import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findTree() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { courses: true } } },
    });
    const byId = new Map(categories.map((c) => [c.id, { ...c, children: [] as any[] }]));
    const roots: any[] = [];
    for (const category of byId.values()) {
      if (category.parentId && byId.has(category.parentId)) {
        byId.get(category.parentId)!.children.push(category);
      } else {
        roots.push(category);
      }
    }
    return roots;
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUniqueOrThrow({
      where: { slug },
      include: { children: true, courses: true },
    });
  }
}
