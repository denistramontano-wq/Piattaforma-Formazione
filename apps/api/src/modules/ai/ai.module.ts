import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { AiProviderModule } from './providers/ai-provider.module';
import { AiUsageService } from './ai-usage.service';
import { SourceResolverService } from './generation/source-resolver.service';
import { AiGenerationService } from './generation/ai-generation.service';
import { AiGenerationController } from './generation/ai-generation.controller';
import { AiChatService } from './chat/ai-chat.service';
import { AiChatController } from './chat/ai-chat.controller';

@Module({
  imports: [AiProviderModule, SearchModule],
  controllers: [AiGenerationController, AiChatController],
  providers: [AiUsageService, SourceResolverService, AiGenerationService, AiChatService],
})
export class AiModule {}
