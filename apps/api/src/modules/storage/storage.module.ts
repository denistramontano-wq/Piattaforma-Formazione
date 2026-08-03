import { Global, Module } from '@nestjs/common';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { SupabaseStorageProvider } from './supabase-storage.provider';
import { STORAGE_PROVIDER } from './storage.tokens';

/**
 * Sceglie il provider di storage in base alle variabili d'ambiente: Supabase se
 * SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY sono impostate (produzione con hosting gratuito,
 * vedi DEPLOY.md), altrimenti disco locale (sviluppo, o Render con disco persistente a
 * pagamento) — stesso pattern usato per l'emulatore Firebase in modules/auth.
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: () => {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey) {
          const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'uploads';
          return new SupabaseStorageProvider(supabaseUrl, supabaseKey, bucket);
        }
        return new LocalDiskStorageProvider();
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
