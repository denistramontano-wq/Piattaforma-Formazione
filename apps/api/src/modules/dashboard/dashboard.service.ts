import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

  async homeHighlights() {
    const user = await this.safeCurrentUser();

    const featured = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, coverUrl: true, level: true, estimatedMinutes: true },
    });

    let continueLearning: any[] = [];
    if (user) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId: user.id, status: 'IN_PROGRESS' },
        include: { course: { select: { title: true, slug: true, coverUrl: true } } },
        orderBy: { enrolledAt: 'desc' },
        take: 3,
      });
      continueLearning = enrollments.map((e) => ({
        title: e.course.title,
        slug: e.course.slug,
        coverUrl: e.course.coverUrl,
        progressPct: e.progressPct,
      }));
    }

    return { featured, continueLearning };
  }

  async userDashboard() {
    const user = await this.currentUser.getCurrentUser();
    const [enrollments, certificates, badges, userLevel] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId: user.id },
        include: { course: { select: { title: true, slug: true, coverUrl: true } } },
      }),
      this.prisma.certificate.count({ where: { userId: user.id } }),
      this.prisma.userBadge.count({ where: { userId: user.id } }),
      this.prisma.userLevel.findUnique({ where: { userId: user.id } }),
    ]);

    return {
      user: { fullName: user.fullName, level: userLevel?.currentLevel ?? 1, totalXp: userLevel?.totalXp ?? 0 },
      coursesInProgress: enrollments.filter((e) => e.status === 'IN_PROGRESS').length,
      coursesCompleted: enrollments.filter((e) => e.status === 'COMPLETED').length,
      certificatesCount: certificates,
      badgeCount: badges,
      courses: enrollments.map((e) => ({
        title: e.course.title,
        slug: e.course.slug,
        coverUrl: e.course.coverUrl,
        status: e.status,
        progressPct: e.progressPct,
      })),
    };
  }

  async adminOverview() {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      quizAttempts,
      inactiveUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.enrollment.count(),
      this.prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.quizAttempt.findMany({ select: { scorePct: true, passed: true } }),
      this.prisma.user.count({
        where: {
          role: 'STUDENT',
          enrollments: { none: { lessonProgress: { some: { lastViewedAt: { gt: new Date(Date.now() - 30 * 24 * 3600 * 1000) } } } } },
        },
      }),
    ]);

    const avgScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((s, a) => s + (a.scorePct ?? 0), 0) / quizAttempts.length
        : 0;
    const passRate =
      quizAttempts.length > 0
        ? (quizAttempts.filter((a) => a.passed).length / quizAttempts.length) * 100
        : 0;

    const topCourses = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { title: true, slug: true, _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
    });

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      avgQuizScore: Math.round(avgScore),
      quizPassRatePct: Math.round(passRate),
      inactiveUsers,
      topCourses: topCourses.map((c) => ({ title: c.title, slug: c.slug, enrollments: c._count.enrollments })),
    };
  }

  async mostMissedQuestions() {
    const attempts = await this.prisma.quizAttempt.count();
    // Placeholder aggregato: nello scaffold non registriamo ancora le risposte
    // per singola domanda (tabella quiz_attempt_answers, vedi docs/10). Con quella
    // tabella collegata, qui si calcolerebbe il tasso di errore reale per domanda.
    const questions = await this.prisma.question.findMany({
      take: 5,
      include: { quiz: { select: { title: true } } },
    });
    return {
      totalAttempts: attempts,
      note:
        'Analytics dimostrativo: collegare quiz_attempt_answers per il tasso di errore reale per domanda (vedi docs/07).',
      sample: questions.map((q) => ({ prompt: q.prompt, quiz: q.quiz.title })),
    };
  }

  private async safeCurrentUser() {
    try {
      return await this.currentUser.getCurrentUser();
    } catch {
      return null;
    }
  }
}
