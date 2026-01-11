import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  imports: [ConfigModule], // .env ma'lumotlarini o'qish uchun kerak
  controllers: [UploadController],
  providers: [SupabaseService], // MANA SHU YERGA QO'SHISH KERAK
  exports: [SupabaseService],   // Agar boshqa modullarda ham ishlatmoqchi bo'lsangiz
})
export class UploadModule {}