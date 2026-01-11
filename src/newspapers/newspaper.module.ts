import { Module } from '@nestjs/common';
import { NewspaperService } from './newspaper.service';
import { NewspaperController } from './newspaper.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NewspaperController],
  providers: [NewspaperService],
  exports: [NewspaperService],
})
export class NewspaperModule {}
