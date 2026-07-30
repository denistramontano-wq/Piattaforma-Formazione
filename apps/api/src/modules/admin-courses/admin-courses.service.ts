import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

interface CourseInput {
  title: string;
  description: string;
  level: 'BASE' | 'INTERMEDIO' | 'AVANZATO';
  estimatedMinutes: number;
  coverUrl?: string | null;
  categoryIds?: string[];
  tags?: string[];
}

@Injectable()
export class AdminCoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

  findAll() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        modules: { select: { id: true, lessons: { select: { id: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        categories: true,
        tags: true,
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: { lessons: { orderBy: { orderIndex: 'asc' } } },
        },
      },
    });
    if (!course) throw new NotFoundException('Corso non trovato');
    return course;
  }

  async create(input: CourseInput) {
    const author = await this.currentUser.getCurrentAdminUser();
    const slug = await this.uniqueSlug(input.title);
    return this.prisma.course.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        coverUrl: input.coverUrl || null,
        level: input.level,
        estimatedMinutes: input.estimatedMinutes,
        authorId: author.id,
        status: 'DRAFT',
        categories: input.categoryIds?.length
          ? { connect: input.categoryIds.map((id) => ({ id })) }
          : undefined,
        tags: input.tags?.length ? { connectOrCreate: input.tags.map(tagConnect) } : undefined,
      },
    });
  }

  async update(id: string, input: Partial<CourseInput>) {
    return this.prisma.course.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        coverUrl: input.coverUrl,
        level: input.level,
        estimatedMinutes: input.estimatedMinutes,
        categories: input.categoryIds
          ? { set: input.categoryIds.map((catId) => ({ id: catId })) }
          : undefined,
        tags: input.tags ? { set: [], connectOrCreate: input.tags.map(tagConnect) } : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }

  async setStatus(id: string, status: string, publishAt?: string) {
    if (status === 'SCHEDULED' && !publishAt) {
      throw new BadRequestException('Specificare una data di pubblicazione per lo stato "programmato"');
    }
    return this.prisma.course.update({
      where: { id },
      data: {
        status: status as any,
        publishAt: status === 'SCHEDULED' ? new Date(publishAt!) : null,
      },
    });
  }

  // --- Moduli ---

  async createModule(courseId: string, title: string) {
    const maxOrder = await this.prisma.module.aggregate({
      where: { courseId },
      _max: { orderIndex: true },
    });
    return this.prisma.module.create({
      data: { courseId, title, orderIndex: (maxOrder._max.orderIndex ?? 0) + 1 },
    });
  }

  updateModule(id: string, title: string) {
    return this.prisma.module.update({ where: { id }, data: { title } });
  }

  removeModule(id: string) {
    return this.prisma.module.delete({ where: { id } });
  }

  async moveModule(id: string, direction: 'up' | 'down') {
    const module = await this.prisma.module.findUniqueOrThrow({ where: { id } });
    const sibling = await this.prisma.module.findFirst({
      where: {
        courseId: module.courseId,
        orderIndex: direction === 'up' ? { lt: module.orderIndex } : { gt: module.orderIndex },
      },
      orderBy: { orderIndex: direction === 'up' ? 'desc' : 'asc' },
    });
    if (!sibling) return module;
    await this.prisma.$transaction([
      this.prisma.module.update({ where: { id: module.id }, data: { orderIndex: sibling.orderIndex } }),
      this.prisma.module.update({ where: { id: sibling.id }, data: { orderIndex: module.orderIndex } }),
    ]);
    return this.prisma.module.findUniqueOrThrow({ where: { id } });
  }

  // --- Lezioni ---

  async createLesson(
    moduleId: string,
    input: {
      title: string;
      contentType: 'TEXT' | 'VIDEO' | 'PDF';
      contentBody?: string;
      videoUrl?: string;
      estimatedMinutes?: number;
    },
  ) {
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { moduleId },
      _max: { orderIndex: true },
    });
    return this.prisma.lesson.create({
      data: {
        moduleId,
        title: input.title,
        contentType: input.contentType,
        contentBody: input.contentBody,
        videoUrl: input.videoUrl,
        estimatedMinutes: input.estimatedMinutes ?? 10,
        orderIndex: (maxOrder._max.orderIndex ?? 0) + 1,
      },
    });
  }

  updateLesson(
    id: string,
    input: Partial<{
      title: string;
      contentType: 'TEXT' | 'VIDEO' | 'PDF';
      contentBody: string;
      videoUrl: string;
      estimatedMinutes: number;
    }>,
  ) {
    return this.prisma.lesson.update({ where: { id }, data: input });
  }

  removeLesson(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }

  async moveLesson(id: string, direction: 'up' | 'down') {
    const lesson = await this.prisma.lesson.findUniqueOrThrow({ where: { id } });
    const sibling = await this.prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        orderIndex: direction === 'up' ? { lt: lesson.orderIndex } : { gt: lesson.orderIndex },
      },
      orderBy: { orderIndex: direction === 'up' ? 'desc' : 'asc' },
    });
    if (!sibling) return lesson;
    await this.prisma.$transaction([
      this.prisma.lesson.update({ where: { id: lesson.id }, data: { orderIndex: sibling.orderIndex } }),
      this.prisma.lesson.update({ where: { id: sibling.id }, data: { orderIndex: lesson.orderIndex } }),
    ]);
    return this.prisma.lesson.findUniqueOrThrow({ where: { id } });
  }

  private async uniqueSlug(title: string) {
    const base = slugify(title);
    let slug = base;
    let i = 1;
    while (await this.prisma.course.findUnique({ where: { slug } })) {
      slug = `${base}-${++i}`;
    }
    return slug;
  }
}

function tagConnect(name: string) {
  return { where: { name }, create: { name } };
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
