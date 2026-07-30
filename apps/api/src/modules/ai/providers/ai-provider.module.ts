import { Global, Module } from '@nestjs/common';
import { AI_CONTENT_PROVIDER } from './ai-content-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { LocalFallbackProvider } from './local-fallback.provider';

@Global()
@Module({
  providers: [
    LocalFallbackProvider,
    AnthropicProvider,
    {
      provide: AI_CONTENT_PROVIDER,
      useFactory: (anthropic: AnthropicProvider, local: LocalFallbackProvider) =>
        process.env.ANTHROPIC_API_KEY ? anthropic : local,
      inject: [AnthropicProvider, LocalFallbackProvider],
    },
  ],
  exports: [AI_CONTENT_PROVIDER],
})
export class AiProviderModule {}
