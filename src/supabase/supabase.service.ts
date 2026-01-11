import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null;
  private readonly logger = new Logger(SupabaseService.name);
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    this.bucketName = this.configService.get<string>('SUPABASE_BUCKET') || 'uploads';

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('⚠️ Supabase configuration is missing in .env!');
      this.supabase = null;
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    subfolder?: string,
  ): Promise<string> {
    // 1. Supabase null emasligini tekshirish va o'zgaruvchiga olish
    const client = this.getSupabaseClient();

    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Fayl bo\'sh yoki yaroqsiz');
    }

    const sanitizedFileName = this.sanitizeFileName(file.originalname);
    const timestamp = Date.now();
    const filePath = subfolder
      ? `${folder}/${subfolder}/${timestamp}-${sanitizedFileName}`
      : `${folder}/${timestamp}-${sanitizedFileName}`;

    // 2. 'client!' o'rniga xavfsiz 'client' ishlatamiz
    const { data, error } = await client.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype || 'application/octet-stream',
      });

    if (error) {
      this.logger.error(`Supabase yuklash xatosi: ${error.message}`);
      throw new BadRequestException(`Yuklash amalga oshmadi: ${error.message}`);
    }

    const { data: publicData } = client.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const client = this.getSupabaseClient();

    try {
      const urlParts = fileUrl.split(`${this.bucketName}/`);
      if (urlParts.length < 2) {
        throw new Error('Fayl URL manzili noto\'g\'ri');
      }
      const filePath = urlParts[1];

      const { error } = await client.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      this.logger.error(`Faylni o'chirishda xatolik: ${error.message}`);
      throw new BadRequestException(`O'chirish amalga oshmadi: ${error.message}`);
    }
  }

  // TypeScript xatosini yo'qotish uchun yordamchi metod
  private getSupabaseClient(): SupabaseClient {
    if (!this.supabase) {
      throw new BadRequestException(
        'Supabase sozlanmagan. .env faylini tekshiring.',
      );
    }
    return this.supabase;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}