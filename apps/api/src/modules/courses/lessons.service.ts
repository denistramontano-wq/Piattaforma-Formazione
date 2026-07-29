import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: { include: { course: true } },
        quizzes: { select: { id: true, title: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Lezione non trovata');
    return {
      id: lesson.id,
      title: lesson.title,
      contentType: lesson.contentType,
      contentBody: lesson.contentBody,
      videoUrl: lesson.videoUrl,
      estimatedMinutes: lesson.estimatedMinutes,
      course: { slug: lesson.module.course.slug, title: lesson.module.course.title },
      module: { id: lesson.module.id, title: lesson.module.title },
      quizzes: lesson.quizzes,
    };
  }

  async complete(id: string) {
    const lesson = await this.prisma.lesson.findUniqueOrThrow({
      where: { id },
      include: { module: true },
    });
    const user = await this.currentUser.getCurrentUser();
    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: lesson.module.courseId } },
      update: {},
      create: { userId: user.id, courseId: lesson.module.courseId },
    });

    await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: id } },
      update: { completed: true, lastViewedAt: new Date() },
      create: { enrollmentId: enrollment.id, lessonId: id, completed: true },
    });

    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({ where: { module: { courseId: lesson.module.courseId } } }),
      this.prisma.lessonProgress.count({
        where: { enrollmentId: enrollment.id, completed: true },
      }),
    ]);
    const progressPct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const isCompleted = progressPct >= 100;

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPct,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isCompleted ? new Date() : null,
      },
    });
  }
}
