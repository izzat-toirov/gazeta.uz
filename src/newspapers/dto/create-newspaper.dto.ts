import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateNewspaperDto {
  @ApiProperty({ description: 'Newspaper title', example: 'Issue #15' })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({
    description: 'Issue date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDateString()
  issueDate: string;

  @ApiProperty({
    description: 'PDF URL for the newspaper',
    example: 'https://matrypqgmxvxgdhfgyjx.supabase.co/storage/v1/object/public/uploads/pdfs/1768108926765-Izzatbek-Toirov-resume-1-.pdf',
  })
  @IsString()
  @Length(1, 500)
  pdfUrl: string;

  @ApiProperty({
    description: 'Cover image URL',
    required: false,
    example: 'https://matrypqgmxvxgdhfgyjx.supabase.co/storage/v1/object/public/uploads/images/1768109062837-images-4-.jfif',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  coverImage?: string;
}
