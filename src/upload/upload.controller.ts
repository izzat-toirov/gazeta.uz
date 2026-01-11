import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SupabaseService } from '../supabase/supabase.service';

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException(`Ruxsat berilmagan fayl turi: ${file.mimetype}`), false);
  }
};

@ApiTags('File Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('image')
  @Roles('SUPER_ADMIN', 'ADMIN', 'REPORTER', 'EDITOR')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Rasm yuklash (Supabase)' })
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file', { fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fayl tanlanmagan');
    const url = await this.supabaseService.uploadFile(file, 'images');
    return { url };
  }

  @Post('pdf')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'PDF yuklash (Supabase)' })
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file', { fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }))
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fayl tanlanmagan');
    const url = await this.supabaseService.uploadFile(file, 'pdfs');
    return { url };
  }

  @Post('document')
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Hujjat yuklash (Word/Excel)' })
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file', { fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fayl tanlanmagan');
    const url = await this.supabaseService.uploadFile(file, 'documents');
    return { url };
  }
}