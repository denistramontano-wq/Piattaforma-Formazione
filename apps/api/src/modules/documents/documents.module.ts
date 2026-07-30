import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AdminDocumentsController } from './admin-documents.controller';
import { AdminDocumentsService } from './admin-documents.service';

@Module({
  controllers: [DocumentsController, AdminDocumentsController],
  providers: [DocumentsService, AdminDocumentsService],
})
export class DocumentsModule {}
