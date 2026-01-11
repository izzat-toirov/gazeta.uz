import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsNumberString,
  IsBooleanString,
  IsString,
  IsIn,
} from 'class-validator';

export class QueryArticleDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: '1',
    default: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: '10',
    default: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: '1',
  })
  @IsOptional()
  @IsNumberString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by author ID',
    example: '1',
  })
  @IsOptional()
  @IsNumberString()
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by published status',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  isPublished?: string;

  @ApiPropertyOptional({
    description: 'Filter by newspaper ID',
    example: '1',
  })
  @IsOptional()
  @IsNumberString()
  newspaperId?: string;

  @ApiPropertyOptional({
    description: 'Search by title or content',
    example: 'search term',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field (createdAt or viewCount)',
    example: 'createdAt',
    enum: ['createdAt', 'viewCount'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'viewCount'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
