import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurrentUserService } from '../../../common/current-user.service';
import { AiUsageService } from '../ai-usage.service';
import { SourceResolverService } from './source-resolver.service';
import {
  AI_CONTENT_PROVIDER,
  AiContentProvider,
  FlashcardItem,
  GeneratedQuestion,
} from '../providers/ai-content-provider.interface';

type GenerationType = 'SUMMARY' | 'FLASHCARDS' | 'QUIZ' | 'CONCEPT_MAP';

@Injectable()
export class AiGenerationService {
  constructor(
    @Inject(AI_CONTENT_PROVIDER) private readonly provider: AiContentProvider,
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
    private readonly usage: AiUsageService,
    private readonly sourceResolver: SourceResolverService,
  ) {}

  listSources() {
    return this.sourceResolver.listOptions();
  }

  findAll(reviewStatus?: string) {
    return this.prisma.aiGeneration.findMany({
      where: reviewStatus ? { reviewStatus: reviewStatus as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { reviewedBy: { select: { fullName: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.aiGeneration.findUniqueOrThrow({ where: { id } });
  }

  async generate(sourceType: 'DOCUMENT' | 'LESSON', sourceId: string, generationType: GenerationType) {
    const source = await this.sourceResolver.resolve(sourceType, sourceId);

    const result = await (async () => {
      switch (generationType) {
        case 'SUMMARY':
          return this.provider.summarize(source.title, source.text);
        case 'FLASHCARDS':
          return this.provider.generateFlashcards(source.title, source.text);
        case 'QUIZ':
          return this.provider.generateQuiz(source.title, source.text);
        case 'CONCEPT_MAP':
          return this.provider.generateConceptMap(source.title, source.text);
      }
    })();

    await this.usage.log('generation', result.provider, result.usage);

    return this.prisma.aiGeneration.create({
      data: {
        sourceType,
        sourceId,
        sourceTitle: source.title,
        generationType,
        output: result.data as any,
        provider: result.provider,
      },
    });
  }

  async approve(id: string) {
    const generation = await this.prisma.aiGeneration.findUniqueOrThrow({ where: { id } });
    if (generation.reviewStatus !== 'PENDING') {
      throw new BadRequestException('Questa generazione è già stata revisionata.');
    }
    const admin = await this.currentUser.getCurrentAdminUser();

    let resultRefId: string | null = null;

    if (generation.generationType === 'FLASHCARDS') {
      const cards = generation.output as unknown as FlashcardItem[];
      const game = await this.prisma.miniGame.create({
        data: {
          title: `Flashcard — ${generation.sourceTitle}`,
          type: 'FLASHCARD',
          description: `Generato dall'IA a partire da "${generation.sourceTitle}".`,
          difficulty: 'BASE',
          config: { cards } as any,
        },
      });
      resultRefId = game.id;
    }

    if (generation.generationType === 'QUIZ') {
      const questions = generation.output as unknown as GeneratedQuestion[];
      const quiz = await this.prisma.quiz.create({
        data: {
          title: `Quiz — ${generation.sourceTitle}`,
          description: `Quiz generato dall'IA a partire da "${generation.sourceTitle}".`,
          passThresholdPct: 60,
          level: 'BASE',
          lessonId: generation.sourceType === 'LESSON' ? generation.sourceId : undefined,
          questions: {
            create: questions.map((q) => ({
              type: q.type,
              prompt: q.prompt,
              payload: q.payload as any,
              explanation: q.explanation,
              scoreWeight: q.scoreWeight,
              difficulty: 'BASE',
            })),
          },
        },
      });
      resultRefId = quiz.id;
    }

    return this.prisma.aiGeneration.update({
      where: { id },
      data: { reviewStatus: 'APPROVED', reviewedById: admin.id, resultRefId },
    });
  }

  async reject(id: string) {
    const generation = await this.prisma.aiGeneration.findUniqueOrThrow({ where: { id } });
    if (generation.reviewStatus !== 'PENDING') {
      throw new BadRequestException('Questa generazione è già stata revisionata.');
    }
    const admin = await this.currentUser.getCurrentAdminUser();
    return this.prisma.aiGeneration.update({
      where: { id },
      data: { reviewStatus: 'REJECTED', reviewedById: admin.id },
    });
  }
}
