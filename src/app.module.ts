import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArticleModule } from './articles/article.module';
import { CategoryModule } from './categories/category.module';
import { NewspaperModule } from './newspapers/newspaper.module';
import { CommentModule } from './comments/comment.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SeedModule } from './seed/seed.module';
import { UploadModule } from './upload/upload.module';
import { AdvertisementModule } from './advertisements/advertisement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ArticleModule,
    CategoryModule,
    NewspaperModule,
    CommentModule,
    UserModule,
    PrismaModule,
    SeedModule,
    UploadModule,
    AdvertisementModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
