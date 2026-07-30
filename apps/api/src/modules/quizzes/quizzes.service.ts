import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';
import { isAnswerCorrect, stripCorrectAnswer } from './quiz-scoring.util';
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
      questionCount: q._count.questions,
      passThresholdPct: q.passThresholdPct,
    }));
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUniqueOrThrow({
      where: { id },
      include: { questions: true },
    });
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passThresholdPct: quiz.passThresholdPct,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        payload: stripCorrectAnswer(q.type as any, q.payload),
        scoreWeight: q.scoreWeight,
        difficulty: q.difficulty,
      })),
    };
  }

  async submit(id: string, answers: Record<string, any>) {
    const quiz = await this.prisma.quiz.findUniqueOrThrow({
      where: { id },
      include: { questions: true },
    });
    const user = await this.currentUser.getCurrentUser();

    let obtained = 0;
    let max = 0;
    const details = quiz.questions.map((q) => {
      max += q.scoreWeight;
      const correct = isAnswerCorrect(q.type as any, q.payload as any, answers[q.id]);
      if (correct) obtained += q.scoreWeight;
      return { questionId: q.id, correct, explanation: q.explanation };
    });

    const scorePct = max > 0 ? (obtained / max) * 100 : 0;
    const passed = scorePct >= quiz.passThresholdPct;

    const attempt = await this.prisma.quizAttempt.create({
      data: { quizId: id, userId: user.id, scorePct, passed, submittedAt: new Date() },
    });
    await this.prisma.quizAttemptAnswer.createMany({
      data: details.map((d) => ({ attemptId: attempt.id, questionId: d.questionId, correct: d.correct })),
    });

    if (passed) {
      await this.xpEngine.award(user.id, 'QUIZ_PASSED', { refType: 'Quiz', refId: id });
    }
    await this.badgeEngine.evaluate(user.id);

    return { scorePct, passed, details };
  }
}
