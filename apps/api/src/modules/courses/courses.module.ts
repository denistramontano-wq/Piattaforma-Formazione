import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [CertificatesModule],
  controllers: [CoursesController, LessonsController],
  providers: [CoursesService, LessonsService],
})
export class CoursesModule {}
