import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name in Uzbek', example: 'Sport' })
  @IsString()
  @Length(1, 100)
  nameUz: string;

  @ApiProperty({
    description: 'Category name in Russian',
    required: false,
    example: 'Спорт',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nameRu?: string;

  @ApiProperty({ description: 'Category slug for URL', example: 'sport' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers, and hyphens only',
  })
  slug: string;
}
