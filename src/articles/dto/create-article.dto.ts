import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Title of the article in Uzbek',
    example: 'Yangi yangilik',
  })
  @IsString()
  @Length(1, 255)
  titleUz: string;

  @ApiProperty({
    description: 'Title of the article in Russian',
    required: false,
    example: 'Новость',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  titleRu?: string;

  @ApiProperty({
    description: 'Content of the article in Uzbek',
    example: "Bu yerda maqolaning to'liq mazmuni...",
  })
  @IsString()
  contentUz: string;

  @ApiProperty({
    description: 'Content of the article in Russian',
    required: false,
    example: 'Здесь полное содержание статьи...',
  })
  @IsOptional()
  @IsString()
  contentRu?: string;

  @ApiProperty({
    description: 'Slug for the article URL',
    example: 'yangi-yangilik',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers, and hyphens only',
  })
  slug: string;

  @ApiProperty({
    description: 'Thumbnail image URL',
    required: false,
    example: 'https://matrypqgmxvxgdhfgyjx.supabase.co/storage/v1/object/public/uploads/images/1768109062837-images-4-.jfif',
  })
  @IsOptional()
  @IsUrl()
  thumbnail?: string;

  @ApiProperty({ description: 'Category ID', example: 1 })
  @IsInt()
  categoryId: number;

  @ApiProperty({ description: 'Author ID', example: 1 })
  @IsInt()
  authorId: number;

  @ApiProperty({
    description: 'Whether the article is published',
    example: false,
  })
  @IsBoolean()
  isPublished: boolean;

  @ApiProperty({
    description: 'Newspaper ID if the article is from a specific newspaper',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  newspaperId?: number;
}