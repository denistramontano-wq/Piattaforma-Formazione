import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';
import { levelForXp } from '../gamification/level-thresholds.util';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const AT_RISK_AFTER_DAYS = 14;

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / ONE_DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function lastNWeekKeys(n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(isoWeekKey(new Date(Date.now() - i * 7 * ONE_DAY_MS)));
  }
  return keys;
}

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

    return { featured, continueLearning, userFullName: user?.fullName ?? null };
  }

  async userDashboard() {
    const user = await this.currentUser.getCurrentUser();
    const [enrollments, certificates, badges, userLevel, quizAttempts, completedLessonProgress, activityTimeline] =
      await Promise.all([
        this.prisma.enrollment.findMany({
          where: { userId: user.id },
          include: {
            course: { select: { title: true, slug: true, coverUrl: true } },
            lessonProgress: { select: { lastViewedAt: true } },
          },
        }),
        this.prisma.certificate.count({ where: { userId: user.id } }),
        this.prisma.userBadge.count({ where: { userId: user.id } }),
        this.prisma.userLevel.findUnique({ where: { userId: user.id } }),
        this.prisma.quizAttempt.findMany({
          where: { userId: user.id, submittedAt: { not: null } },
          orderBy: { submittedAt: 'asc' },
          take: 10,
          include: { quiz: { select: { title: true } } },
        }),
        this.prisma.lessonProgress.findMany({
          where: { enrollment: { userId: user.id }, completed: true },
          include: { lesson: { select: { estimatedMinutes: true } } },
        }),
        this.buildActivityTimeline(user.id, 15),
      ]);

    const now = Date.now();
    let completedCount = 0;
    let atRiskCount = 0;
    let inProgressCount = 0;
    for (const e of enrollments) {
      if (e.status === 'COMPLETED') {
        completedCount++;
        continue;
      }
      const lastActivity = e.lessonProgress.reduce<number>(
        (max, lp) => Math.max(max, lp.lastViewedAt.getTime()),
        e.enrolledAt.getTime(),
      );
      if (now - lastActivity > AT_RISK_AFTER_DAYS * ONE_DAY_MS) {
        atRiskCount++;
      } else {
        inProgressCount++;
      }
    }

    const weekKeys = lastNWeekKeys(8);
    const minutesByWeek = new Map<string, number>(weekKeys.map((k) => [k, 0]));
    for (const lp of completedLessonProgress) {
      const key = isoWeekKey(lp.lastViewedAt);
      if (minutesByWeek.has(key)) {
        minutesByWeek.set(key, (minutesByWeek.get(key) ?? 0) + lp.lesson.estimatedMinutes);
      }
    }

    const totalXp = userLevel?.totalXp ?? 0;
    const levelInfo = levelForXp(totalXp);

    return {
      user: {
        fullName: user.fullName,
        level: levelInfo.level,
        levelName: levelInfo.name,
        totalXp,
        progressPct: levelInfo.progressPct,
      },
      coursesInProgress: inProgressCount,
      coursesCompleted: completedCount,
      certificatesCount: certificates,
      badgeCount: badges,
      courses: enrollments.map((e) => ({
        title: e.course.title,
        slug: e.course.slug,
        coverUrl: e.course.coverUrl,
        status: e.status,
        progressPct: e.progressPct,
      })),
      statusBreakdown: [
        { name: 'Completati', value: completedCount },
        { name: 'In corso', value: inProgressCount },
        { name: 'A rischio abbandono', value: atRiskCount },
      ],
      quizScoreTrend: quizAttempts.map((a) => ({
        date: a.submittedAt,
        scorePct: Math.round(a.scorePct ?? 0),
        quizTitle: a.quiz.title,
      })),
      weeklyStudyMinutes: weekKeys.map((k) => ({ week: k.split('-W')[1], minutes: minutesByWeek.get(k) ?? 0 })),
      activityTimeline,
    };
  }

  async myActivityLog() {
    const user = await this.currentUser.getCurrentUser();
    return this.buildActivityTimeline(user.id, 50);
  }

  private async buildActivityTimeline(userId: string, limit: number) {
    const [xpEvents, badgeEvents, certificateEvents] = await Promise.all([
      this.prisma.xpEvent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit }),
      this.prisma.userBadge.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
        take: limit,
        include: { badge: { select: { name: true } } },
      }),
      this.prisma.certificate.findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
        take: limit,
        include: { course: { select: { title: true } } },
      }),
    ]);

    const events = [
      ...xpEvents.map((e) => ({ type: 'xp' as const, action: e.action, points: e.points, createdAt: e.createdAt })),
      ...badgeEvents.map((b) => ({
        type: 'badge' as const,
        label: b.badge.name,
        createdAt: b.earnedAt,
      })),
      ...certificateEvents.map((c) => ({
        type: 'certificate' as const,
        label: c.course.title,
        createdAt: c.issuedAt,
      })),
    ];

    return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  async adminOverview() {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      quizAttempts,
      inactiveUsers,
      newUsers,
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
      this.prisma.user.findMany({
        where: { role: 'STUDENT', createdAt: { gt: new Date(Date.now() - 56 * ONE_DAY_MS) } },
        select: { createdAt: true },
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

    const weekKeys = lastNWeekKeys(8);
    const newUsersByWeek = new Map<string, number>(weekKeys.map((k) => [k, 0]));
    for (const u of newUsers) {
      const key = isoWeekKey(u.createdAt);
      if (newUsersByWeek.has(key)) newUsersByWeek.set(key, (newUsersByWeek.get(key) ?? 0) + 1);
    }

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      avgQuizScore: Math.round(avgScore),
      quizPassRatePct: Math.round(passRate),
      inactiveUsers,
      topCourses: topCourses.map((c) => ({ title: c.title, slug: c.slug, enrollments: c._count.enrollments })),
      newUsersTrend: weekKeys.map((k) => ({ week: k.split('-W')[1], count: newUsersByWeek.get(k) ?? 0 })),
    };
  }

  async courseStats() {
    const courses = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        enrollments: { select: { status: true, progressPct: true } },
        modules: {
          select: { lessons: { select: { quizzes: { select: { attempts: { select: { scorePct: true } } } } } } },
        },
      },
    });

    return courses
      .map((c) => {
        const enrollments = c.enrollments.length;
        const completions = c.enrollments.filter((e) => e.status === 'COMPLETED').length;
        const avgProgressPct =
          enrollments > 0 ? c.enrollments.reduce((s, e) => s + e.progressPct, 0) / enrollments : 0;
        const quizScores = c.modules
          .flatMap((m) => m.lessons)
          .flatMap((l) => l.quizzes)
          .flatMap((q) => q.attempts)
          .map((a) => a.scorePct)
          .filter((s): s is number => s !== null);
        const avgQuizScore =
          quizScores.length > 0 ? quizScores.reduce((s, v) => s + v, 0) / quizScores.length : null;

        return {
          title: c.title,
          slug: c.slug,
          enrollments,
          completions,
          completionRatePct: enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0,
          avgProgressPct: Math.round(avgProgressPct),
          avgQuizScore: avgQuizScore !== null ? Math.round(avgQuizScore) : null,
        };
      })
      .sort((a, b) => b.enrollments - a.enrollments);
  }

  async mostMissedQuestions() {
    const answers = await this.prisma.quizAttemptAnswer.groupBy({
      by: ['questionId'],
      _count: { _all: true },
    });
    const incorrect = await this.prisma.quizAttemptAnswer.groupBy({
      by: ['questionId'],
      where: { correct: false },
      _count: { _all: true },
    });
    const incorrectByQuestion = new Map(incorrect.map((i) => [i.questionId, i._count._all]));

    const ranked = answers
      .map((a) => ({
        questionId: a.questionId,
        total: a._count._all,
        incorrect: incorrectByQuestion.get(a.questionId) ?? 0,
      }))
      .filter((r) => r.incorrect > 0)
      .map((r) => ({ ...r, errorRatePct: Math.round((r.incorrect / r.total) * 100) }))
      .sort((a, b) => b.errorRatePct - a.errorRatePct || b.total - a.total)
      .slice(0, 10);

    if (ranked.length === 0) return [];

    const questions = await this.prisma.question.findMany({
      where: { id: { in: ranked.map((r) => r.questionId) } },
      include: { quiz: { select: { id: true, title: true } } },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));

    return ranked
      .map((r) => {
        const q = byId.get(r.questionId);
        if (!q) return null;
        return {
          questionId: r.questionId,
          prompt: q.prompt,
          quizId: q.quiz.id,
          quizTitle: q.quiz.title,
          totalAnswers: r.total,
          incorrectAnswers: r.incorrect,
          errorRatePct: r.errorRatePct,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }

  async inactiveUsers(days: number) {
    const threshold = new Date(Date.now() - days * ONE_DAY_MS);
    const users = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [{ lastActiveDate: null }, { lastActiveDate: { lt: threshold } }],
      },
      select: { id: true, fullName: true, email: true, lastActiveDate: true, currentStreak: true },
    });
    return users.sort((a, b) => {
      if (!a.lastActiveDate && !b.lastActiveDate) return 0;
      if (!a.lastActiveDate) return -1;
      if (!b.lastActiveDate) return 1;
      return a.lastActiveDate.getTime() - b.lastActiveDate.getTime();
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
