import { Controller, Inject, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import type { StorageProvider } from '../storage/storage.provider';
import { STORAGE_PROVIDER } from '../storage/storage.tokens';

@Controller('uploads')
export class UploadsController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const filename = `${uuid()}${extname(file.originalname)}`;
    const url = await this.storage.upload({ buffer: file.buffer, filename, mimeType: file.mimetype });
    return {
      url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }
}
