import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { VideosModule } from './modules/videos/videos.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { GamesModule } from './modules/games/games.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { FaqModule } from './modules/faq/faq.module';
import { UsersModule } from './modules/users/users.module';
import { ProgressModule } from './modules/progress/progress.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AdminCategoriesModule } from './modules/admin-categories/admin-categories.module';
import { AdminCoursesModule } from './modules/admin-courses/admin-courses.module';
import { AdminQuizzesModule } from './modules/admin-quizzes/admin-quizzes.module';
import { SearchModule } from './modules/search/search.module';
import { AiModule } from './modules/ai/ai.module';
import { GamificationModule } from './modules/gamification/gamification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CommonModule,
    CategoriesModule,
    CoursesModule,
    DocumentsModule,
    VideosModule,
    QuizzesModule,
    GamesModule,
    DownloadsModule,
    FaqModule,
    UsersModule,
    ProgressModule,
    CertificatesModule,
    DashboardModule,
    UploadsModule,
    AdminCategoriesModule,
    AdminCoursesModule,
    AdminQuizzesModule,
    SearchModule,
    AiModule,
    GamificationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
