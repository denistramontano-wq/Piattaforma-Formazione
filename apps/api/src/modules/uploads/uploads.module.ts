import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    // Nessuno storage engine configurato: multer tiene il file in memoria (file.buffer),
    // così il controller può passarlo al provider di storage attivo (disco locale o
    // Supabase Storage — vedi modules/storage) senza mai toccare il filesystem qui.
    MulterModule.register({
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB — vedi criticità upload video in docs/02
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
