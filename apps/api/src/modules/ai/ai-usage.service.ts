import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiUsage } from './providers/ai-content-provider.interface';

@Injectable()
export class AiUsageService {
  constructor(private readonly prisma: PrismaService) {}

  log(kind: 'generation' | 'chat', provider: string, usage: AiUsage) {
    return this.prisma.aiUsageLog.create({
      data: {
        kind,
        provider,
        tokensInput: usage.tokensInput,
        tokensOutput: usage.tokensOutput,
        costUsd: usage.costUsd,
      },
    });
  }

  async summary() {
    const logs = await this.prisma.aiUsageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
    const totalCalls = logs.length;
    const totalTokens = logs.reduce((s, l) => s + l.tokensInput + l.tokensOutput, 0);
    const totalCostUsd = logs.reduce((s, l) => s + l.costUsd, 0);
    const byKind = groupCount(logs, (l) => l.kind);
    const byProvider = groupCount(logs, (l) => l.provider);
    const recent = logs.slice(0, 20).map((l) => ({
      kind: l.kind,
      provider: l.provider,
      tokensInput: l.tokensInput,
      tokensOutput: l.tokensOutput,
      costUsd: l.costUsd,
      createdAt: l.createdAt,
    }));
    return { totalCalls, totalTokens, totalCostUsd, byKind, byProvider, recent };
  }
}

function groupCount<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Object.fromEntries(map);
}
