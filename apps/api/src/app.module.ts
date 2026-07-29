import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
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
  ],
  controllers: [AppController],
})
export class AppModule {}
