import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';
import { isAnswerCorrect, shuffle, stripCorrectAnswer } from './quiz-scoring.util';
import { XpEngineService } from '../gamification/xp-engine.service';
import { BadgeEngineService } from '../gamification/badge-engine.service';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
    private readonly xpEngine: XpEngineService,
    private readonly badgeEngine: BadgeEngineService,
  ) {}

  async findAll() {
    const quizzes = await this.prisma.quiz.findMany({
      include: { _count: { select: { questions: true } } },
    });
    return quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      level: q.level,
      questionCount: q.bankSize ?? q._count.questions,
      passThresholdPct: q.passThresholdPct,
    }));
  }

  /** Anteprima del quiz (metadati + tentativi residui), senza consumare un tentativo. */
  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    const user = await this.currentUser.getCurrentUser();
    const attemptsUsed = await this.prisma.quizAttempt.count({
      where: { quizId: id, userId: user.id, submittedAt: { not: null } },
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passThresholdPct: quiz.passThresholdPct,
      level: quiz.level,
      questionCount: quiz.bankSize ?? quiz._count.questions,
      maxAttempts: quiz.maxAttempts,
      timeLimitSeconds: quiz.timeLimitSeconds,
      attemptsUsed,
      canAttempt: quiz.maxAttempts === null || attemptsUsed < quiz.maxAttempts,
    };
  }

  /** Avvia un tentativo: fissa (ed eventualmente estrae/mescola) l'insieme di domande da presentare. */
  async startAttempt(id: string) {
    const quiz = await this.prisma.quiz.findUniqueOrThrow({
      where: { id },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    if (quiz.questions.length === 0) {
      throw new BadRequestException('Questo quiz non ha ancora domande configurate.');
    }
    const user = await this.currentUser.getCurrentUser();
    const attemptsUsed = await this.prisma.quizAttempt.count({
      where: { quizId: id, userId: user.id, submittedAt: { not: null } },
    });
    if (quiz.maxAttempts !== null && attemptsUsed >= quiz.maxAttempts) {
      throw new BadRequestException('Numero massimo di tentativi raggiunto per questo quiz.');
    }

    let pool = quiz.questions;
    if (quiz.bankSize && quiz.bankSize < pool.length) {
      pool = shuffle(pool).slice(0, quiz.bankSize);
    }
    if (quiz.questionMode === 'RANDOM') {
      pool = shuffle(pool);
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: { quizId: id, userId: user.id, questionIds: pool.map((q) => q.id) },
    });

    return {
      attemptId: attempt.id,
      timeLimitSeconds: quiz.timeLimitSeconds,
      questions: pool.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        payload: stripCorrectAnswer(q.type as any, q.payload),
        scoreWeight: q.scoreWeight,
        difficulty: q.difficulty,
      })),
    };
  }

  async submitAttempt(attemptId: string, answers: Record<string, any>) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: true },
    });
    if (!attempt) throw new NotFoundException('Tentativo non trovato.');
    if (attempt.submittedAt) throw new BadRequestException('Questo tentativo è già stato inviato.');

    const questionIds = attempt.questionIds as string[];
    const questions = await this.prisma.question.findMany({ where: { id: { in: questionIds } } });
    const byId = new Map(questions.map((q) => [q.id, q]));

    let obtained = 0;
    let max = 0;
    const details = questionIds.map((qid) => {
      const q = byId.get(qid)!;
      max += q.scoreWeight;
      const correct = isAnswerCorrect(q.type as any, q.payload as any, answers[qid]);
      if (correct) obtained += q.scoreWeight;
      return { questionId: qid, correct, explanation: q.explanation };
    });

    const scorePct = max > 0 ? (obtained / max) * 100 : 0;
    const passed = scorePct >= attempt.quiz.passThresholdPct;

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { scorePct, passed, submittedAt: new Date() },
    });
    await this.prisma.quizAttemptAnswer.createMany({
      data: details.map((d) => ({ attemptId, questionId: d.questionId, correct: d.correct })),
    });

    const user = await this.currentUser.getCurrentUser();
    if (passed) {
      await this.xpEngine.award(user.id, 'QUIZ_PASSED', { refType: 'Quiz', refId: attempt.quizId });
    }
    await this.badgeEngine.evaluate(user.id);

    const attemptsUsed = await this.prisma.quizAttempt.count({
      where: { quizId: attempt.quizId, userId: user.id, submittedAt: { not: null } },
    });
    const maxAttempts = attempt.quiz.maxAttempts;

    return {
      scorePct,
      passed,
      details,
      attemptsUsed,
      maxAttempts,
      canRetry: maxAttempts === null || attemptsUsed < maxAttempts,
    };
  }
}
