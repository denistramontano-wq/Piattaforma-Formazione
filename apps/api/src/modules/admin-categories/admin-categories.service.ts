import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllFlat() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { courses: true, documents: true, videos: true, faqs: true, downloads: true } },
      },
    });
    const byId = new Map(categories.map((c) => [c.id, c]));

    function depth(id: string | null, seen = new Set<string>()): number {
      if (!id || seen.has(id)) return 0;
      seen.add(id);
      const parent = byId.get(id);
      return parent ? 1 + depth(parent.parentId, seen) : 0;
    }

    return categories
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parentId,
        depth: depth(c.parentId),
        usageCount:
          c._count.courses + c._count.documents + c._count.videos + c._count.faqs + c._count.downloads,
      }));
  }

  create(data: { name: string; parentId?: string | null }) {
    const slug = slugify(data.name);
    return this.prisma.category.create({
      data: { name: data.name, slug, parentId: data.parentId || null },
    });
  }

  update(id: string, data: { name?: string; parentId?: string | null }) {
    if (data.parentId === id) {
      throw new BadRequestException('Una categoria non può essere genitore di sé stessa');
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.name ? slugify(data.name) : undefined,
        parentId: data.parentId === undefined ? undefined : data.parentId || null,
      },
    });
  }

  async remove(id: string) {
    const childrenCount = await this.prisma.category.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      throw new BadRequestException(
        'Impossibile eliminare: la categoria ha sottocategorie. Rimuovile prima.',
      );
    }
    return this.prisma.category.delete({ where: { id } });
  }
}

const DIACRITICS_REGEX = /[̀-ͯ]/g;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
