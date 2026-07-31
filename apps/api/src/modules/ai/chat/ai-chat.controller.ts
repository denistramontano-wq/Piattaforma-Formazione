import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { Roles } from '../../auth/roles.decorator';

@Controller()
export class AiChatController {
  constructor(private readonly service: AiChatService) {}

  @Post('ai/chat')
  ask(
    @Body()
    body: { question: string; conversationId?: string; scopeType?: string; scopeId?: string },
  ) {
    return this.service.ask(body.question, body.conversationId, body.scopeType, body.scopeId);
  }

  @Get('ai/chat/conversations')
  listConversations() {
    return this.service.listConversations();
  }

  @Get('ai/chat/:id')
  getConversation(@Param('id') id: string) {
    return this.service.getConversation(id);
  }

  @Roles('ADMIN')
  @Get('admin/ai/unresolved-questions')
  unresolved() {
    return this.service.mostUnresolved();
  }
}
