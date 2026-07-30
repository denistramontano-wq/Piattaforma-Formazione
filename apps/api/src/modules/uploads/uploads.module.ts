import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { UploadsController } from './uploads.controller';

// process.cwd() (non __dirname) per restare stabile sia in dev (ts-node/tsc --watch,
// che compila in dist/) sia in produzione — altrimenti la cartella verrebbe ricreata
// dentro dist/ e persa a ogni build (nest-cli.json ha deleteOutDir: true).
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          cb(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB — vedi criticità upload video in docs/02
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
