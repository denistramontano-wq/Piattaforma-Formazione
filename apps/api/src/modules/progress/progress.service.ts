import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

  async overview() {
    const user = await this.currentUser.getCurrentUser();

    const [enrollments, quizAttempts, lessonProgress, badges, certificates] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId: user.id },
        include: { course: { select: { title: true, slug: true, coverUrl: true } } },
      }),
      this.prisma.quizAttempt.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: { quiz: { select: { title: true } } },
      }),
      this.prisma.lessonProgress.findMany({
        where: { enrollment: { userId: user.id } },
      }),
      this.prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
      this.prisma.certificate.count({ where: { userId: user.id } }),
    ]);

    const totalStudySeconds = lessonProgress.reduce((sum, p) => sum + p.timeSpentSeconds, 0);
    const completedCourses = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const inProgressCourses = enrollments.filter((e) => e.status === 'IN_PROGRESS').length;
    const avgQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + (a.scorePct ?? 0), 0) / quizAttempts.length
        : 0;

    return {
      completedCourses,
      inProgressCourses,
      totalStudyMinutes: Math.round(totalStudySeconds / 60),
      avgQuizScore: Math.round(avgQuizScore),
      certificatesCount: certificates,
      badges: badges.map((b) => ({ name: b.badge.name, earnedAt: b.earnedAt })),
      courses: enrollments.map((e) => ({
        title: e.course.title,
        slug: e.course.slug,
        coverUrl: e.course.coverUrl,
        status: e.status,
        progressPct: e.progressPct,
      })),
      recentQuizResults: quizAttempts.map((a) => ({
        quizTitle: a.quiz.title,
        scorePct: a.scorePct,
        passed: a.passed,
        submittedAt: a.submittedAt,
      })),
    };
  }
}
