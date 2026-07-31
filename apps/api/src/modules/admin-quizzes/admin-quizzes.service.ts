import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface QuizInput {
  title: string;
  description?: string | null;
  lessonId?: string | null;
  passThresholdPct?: number;
  level?: 'BASE' | 'INTERMEDIO' | 'AVANZATO';
  maxAttempts?: number | null;
  timeLimitSeconds?: number | null;
  questionMode?: 'SEQUENTIAL' | 'RANDOM';
  bankSize?: number | null;
}

interface QuestionInput {
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
  explanation?: string | null;
  scoreWeight?: number;
  difficulty?: 'BASE' | 'INTERMEDIO' | 'AVANZATO';
}

@Injectable()
export class AdminQuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async listQuizzes() {
    const quizzes = await this.prisma.quiz.findMany({
      include: { _count: { select: { questions: true, attempts: true } }, lesson: { select: { title: true } } },
      orderBy: { title: 'asc' },
    });
    return quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      level: q.level,
      lessonTitle: q.lesson?.title ?? null,
      questionCount: q._count.questions,
      attemptCount: q._count.attempts,
    }));
  }

  getQuiz(id: string) {
    return this.prisma.quiz.findUniqueOrThrow({
      where: { id },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  createQuiz(input: QuizInput) {
    return this.prisma.quiz.create({
      data: {
        title: input.title,
        description: input.description,
        lessonId: input.lessonId,
        passThresholdPct: input.passThresholdPct ?? 60,
        level: input.level ?? 'BASE',
        maxAttempts: input.maxAttempts,
        timeLimitSeconds: input.timeLimitSeconds,
        questionMode: input.questionMode ?? 'SEQUENTIAL',
        bankSize: input.bankSize,
      },
    });
  }

  updateQuiz(id: string, input: Partial<QuizInput>) {
    return this.prisma.quiz.update({ where: { id }, data: input });
  }

  async removeQuiz(id: string) {
    const attemptCount = await this.prisma.quizAttempt.count({ where: { quizId: id } });
    if (attemptCount > 0) {
      throw new BadRequestException(
        'Impossibile eliminare: il quiz ha già dei tentativi registrati. Puoi comunque rimuoverne le domande.',
      );
    }
    return this.prisma.quiz.delete({ where: { id } });
  }

  async addQuestion(quizId: string, input: QuestionInput) {
    const maxOrder = await this.prisma.question.aggregate({
      where: { quizId },
      _max: { orderIndex: true },
    });
    return this.prisma.question.create({
      data: {
        quizId,
        type: input.type as any,
        prompt: input.prompt,
        payload: input.payload as any,
        explanation: input.explanation,
        scoreWeight: input.scoreWeight ?? 1,
        difficulty: input.difficulty ?? 'BASE',
        orderIndex: (maxOrder._max.orderIndex ?? 0) + 1,
      },
    });
  }

  updateQuestion(id: string, input: Partial<QuestionInput>) {
    return this.prisma.question.update({
      where: { id },
      data: {
        ...(input.type !== undefined ? { type: input.type as any } : {}),
        ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
        ...(input.payload !== undefined ? { payload: input.payload as any } : {}),
        ...(input.explanation !== undefined ? { explanation: input.explanation } : {}),
        ...(input.scoreWeight !== undefined ? { scoreWeight: input.scoreWeight } : {}),
        ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
      },
    });
  }

  removeQuestion(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }

  async moveQuestion(id: string, direction: 'up' | 'down') {
    const question = await this.prisma.question.findUniqueOrThrow({ where: { id } });
    const sibling = await this.prisma.question.findFirst({
      where: {
        quizId: question.quizId,
        orderIndex: direction === 'up' ? { lt: question.orderIndex } : { gt: question.orderIndex },
      },
      orderBy: { orderIndex: direction === 'up' ? 'desc' : 'asc' },
    });
    if (!sibling) return question;
    await this.prisma.$transaction([
      this.prisma.question.update({ where: { id: question.id }, data: { orderIndex: sibling.orderIndex } }),
      this.prisma.question.update({ where: { id: sibling.id }, data: { orderIndex: question.orderIndex } }),
    ]);
    return this.prisma.question.findUniqueOrThrow({ where: { id } });
  }

  async analytics(quizId: string) {
    const quiz = await this.prisma.quiz.findUniqueOrThrow({
      where: { id: quizId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, submittedAt: { not: null } },
      select: { scorePct: true, passed: true },
    });
    const avgScore =
      attempts.length > 0 ? attempts.reduce((s, a) => s + (a.scorePct ?? 0), 0) / attempts.length : 0;
    const passRate = attempts.length > 0 ? (attempts.filter((a) => a.passed).length / attempts.length) * 100 : 0;

    const [totals, incorrects] = await Promise.all([
      this.prisma.quizAttemptAnswer.groupBy({
        by: ['questionId'],
        where: { questionId: { in: quiz.questions.map((q) => q.id) } },
        _count: { _all: true },
      }),
      this.prisma.quizAttemptAnswer.groupBy({
        by: ['questionId'],
        where: { questionId: { in: quiz.questions.map((q) => q.id) }, correct: false },
        _count: { _all: true },
      }),
    ]);
    const totalByQ = new Map(totals.map((t) => [t.questionId, t._count._all]));
    const incorrectByQ = new Map(incorrects.map((t) => [t.questionId, t._count._all]));

    return {
      attemptCount: attempts.length,
      avgScorePct: Math.round(avgScore),
      passRatePct: Math.round(passRate),
      questions: quiz.questions.map((q) => {
        const total = totalByQ.get(q.id) ?? 0;
        const incorrect = incorrectByQ.get(q.id) ?? 0;
        return {
          questionId: q.id,
          prompt: q.prompt,
          totalAnswers: total,
          incorrectAnswers: incorrect,
          errorRatePct: total > 0 ? Math.round((incorrect / total) * 100) : null,
        };
      }),
    };
  }
}
