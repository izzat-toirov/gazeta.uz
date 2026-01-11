import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment text',
    example: 'Bu maqola juda foydali!',
  })
  @IsString()
  @Length(1, 1000)
  text: string;

  @ApiProperty({ description: 'Article ID', example: 1 })
  @IsInt()
  articleId: number;
}
