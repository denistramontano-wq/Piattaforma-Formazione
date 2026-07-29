import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.faq.findMany({ include: { category: true } });
  }
}
