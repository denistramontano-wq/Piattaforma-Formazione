import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurrentUserService } from '../../../common/current-user.service';
import { SearchService } from '../../search/search.service';
import { AiUsageService } from '../ai-usage.service';
import { AI_CONTENT_PROVIDER, AiContentProvider, AiContextChunk } from '../providers/ai-content-provider.interface';

const CONTEXT_LIMIT = 5;

@Injectable()
export class AiChatService {
  constructor(
    @Inject(AI_CONTENT_PROVIDER) private readonly provider: AiContentProvider,
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
    private readonly search: SearchService,
    private readonly usage: AiUsageService,
  ) {}

  async ask(question: string, conversationId?: string, scopeType = 'global', scopeId?: string) {
    const user = await this.currentUser.getCurrentUser();

    const conversation = conversationId
      ? await this.prisma.chatConversation.findUniqueOrThrow({ where: { id: conversationId } })
      : await this.prisma.chatConversation.create({ data: { userId: user.id, scopeType, scopeId } });

    await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'USER', content: question },
    });

    const { results } = await this.search.search(question, undefined, 'or');
    const context: AiContextChunk[] = results
      .slice(0, CONTEXT_LIMIT)
      .map((r) => ({ title: r.title, snippet: r.snippet ?? '', url: r.url }));

    const result = await this.provider.answer(question, context);
    await this.usage.log('chat', result.provider, result.usage);

    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: result.data,
        sources: context as any,
      },
    });

    return {
      conversationId: conversation.id,
      answer: result.data,
      sources: context,
      provider: result.provider,
      messageId: assistantMessage.id,
    };
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversazione non trovata');
    return conversation;
  }

  async listConversations() {
    const user = await this.currentUser.getCurrentUser();
    const conversations = await this.prisma.chatConversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    return conversations.map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      preview: c.messages[0]?.content?.slice(0, 80) ?? '(vuota)',
    }));
  }

  async mostUnresolved() {
    // Le domande dell'assistente senza fonti pertinenti sono un segnale diretto
    // di gap di contenuto (docs/06 §6.4 — "Admin — Monitor IA").
    const messages = await this.prisma.chatMessage.findMany({
      where: { role: 'ASSISTANT' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const unresolved = messages.filter((m) => !m.sources || (m.sources as any[]).length === 0);
    return unresolved.slice(0, 20).map((m) => ({ id: m.id, content: m.content, createdAt: m.createdAt }));
  }
}
