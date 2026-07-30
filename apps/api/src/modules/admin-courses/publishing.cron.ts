import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Pubblicazione programmata (docs/02-gestione-contenuti.md §2.7): ogni minuto
 * promuove a PUBLISHED i corsi in stato SCHEDULED la cui data è arrivata.
 */
@Injectable()
export class PublishingCron {
  private readonly logger = new Logger(PublishingCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePublishing() {
    const result = await this.prisma.course.updateMany({
      where: { status: 'SCHEDULED', publishAt: { lte: new Date() } },
      data: { status: 'PUBLISHED' },
    });
    if (result.count > 0) {
      this.logger.log(`Pubblicati automaticamente ${result.count} corsi programmati`);
    }
  }
}
