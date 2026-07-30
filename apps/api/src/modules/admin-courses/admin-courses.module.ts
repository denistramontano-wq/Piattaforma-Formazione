import { Module } from '@nestjs/common';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminModulesController } from './admin-modules.controller';
import { AdminLessonsController } from './admin-lessons.controller';
import { AdminCoursesService } from './admin-courses.service';
import { PublishingCron } from './publishing.cron';

@Module({
  controllers: [AdminCoursesController, AdminModulesController, AdminLessonsController],
  providers: [AdminCoursesService, PublishingCron],
})
export class AdminCoursesModule {}
