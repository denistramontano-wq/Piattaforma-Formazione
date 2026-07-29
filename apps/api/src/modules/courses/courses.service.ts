import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

interface FindAllParams {
  category?: string;
  level?: string;
  tag?: string;
  q?: string;
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

  async findAll(params: FindAllParams) {
    const courses = await this.prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        categories: params.category ? { some: { slug: params.category } } : undefined,
        tags: params.tag ? { some: { name: params.tag } } : undefined,
        level: (params.level as any) || undefined,
        OR: params.q
          ? [
              { title: { contains: params.q, mode: 'insensitive' } },
              { description: { contains: params.q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        categories: true,
        tags: true,
        modules: { select: { id: true, lessons: { select: { id: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const user = await this.safeCurrentUser();
    const enrollments = user
      ? await this.prisma.enrollment.findMany({ where: { userId: user.id } })
      : [];
    const enrollmentByCourse = new Map(enrollments.map((e) => [e.courseId, e]));

    return courses.map((course) => {
      const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const enrollment = enrollmentByCourse.get(course.id);
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        coverUrl: course.coverUrl,
        level: course.level,
        estimatedMinutes: course.estimatedMinutes,
        categories: course.categories.map((c) => ({ name: c.name, slug: c.slug })),
        tags: course.tags.map((t) => t.name),
        moduleCount: course.modules.length,
        lessonCount,
        enrollment: enrollment
          ? { status: enrollment.status, progressPct: enrollment.progressPct }
          : null,
      };
    });
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        author: { select: { fullName: true } },
        categories: true,
        tags: true,
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: { lessons: { orderBy: { orderIndex: 'asc' } } },
        },
      },
    });
    if (!course) throw new NotFoundException(`Corso "${slug}" non trovato`);

    const user = await this.safeCurrentUser();
    const enrollment = user
      ? await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
          include: { lessonProgress: true },
        })
      : null;

    const completedLessonIds = new Set(
      (enrollment?.lessonProgress ?? []).filter((p) => p.completed).map((p) => p.lessonId),
    );

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      coverUrl: course.coverUrl,
      level: course.level,
      estimatedMinutes: course.estimatedMinutes,
      author: course.author.fullName,
      categories: course.categories.map((c) => ({ name: c.name, slug: c.slug })),
      tags: course.tags.map((t) => t.name),
      enrollment: enrollment
        ? { status: enrollment.status, progressPct: enrollment.progressPct }
        : null,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          estimatedMinutes: l.estimatedMinutes,
          contentType: l.contentType,
          completed: completedLessonIds.has(l.id),
        })),
      })),
    };
  }

  async enroll(slug: string) {
    const course = await this.prisma.course.findUniqueOrThrow({ where: { slug } });
    const user = await this.currentUser.getCurrentUser();
    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: {},
      create: { userId: user.id, courseId: course.id },
    });
  }

  private async safeCurrentUser() {
    try {
      return await this.currentUser.getCurrentUser();
    } catch {
      return null;
    }
  }
}
