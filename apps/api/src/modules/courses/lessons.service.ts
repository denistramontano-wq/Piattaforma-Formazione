import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';
import { XpEngineService } from '../gamification/xp-engine.service';
import { BadgeEngineService } from '../gamification/badge-engine.service';
import { CertificatesService } from '../certificates/certificates.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
    private readonly xpEngine: XpEngineService,
    private readonly badgeEngine: BadgeEngineService,
    private readonly certificates: CertificatesService,
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

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: id } },
    });
    const alreadyCompleted = existing?.completed ?? false;

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
    const wasCompleted = enrollment.status === 'COMPLETED';
    const isCompleted = progressPct >= 100;

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPct,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isCompleted ? new Date() : null,
      },
    });

    if (!alreadyCompleted) {
      await this.xpEngine.award(user.id, 'LESSON_COMPLETED', { refType: 'Lesson', refId: id });
    }
    if (isCompleted && !wasCompleted) {
      await this.xpEngine.award(user.id, 'COURSE_COMPLETED', {
        refType: 'Course',
        refId: lesson.module.courseId,
      });
      await this.certificates.issueForCourseCompletion(user.id, lesson.module.courseId);
    }
    await this.badgeEngine.evaluate(user.id);

    return updated;
  }
}
