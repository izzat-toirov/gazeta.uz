import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreateAdvertisementDto {
  @ApiProperty({
    description: 'Advertisement title',
    example: 'Summer Sale',
  })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({
    description: 'Advertisement image URL',
    example: 'https://example.com/ad-image.jpg',
  })
  @IsString()
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: 'External link for the advertisement',
    required: false,
    example: 'https://example.com/promotion',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  link?: string;

  @ApiProperty({
    description: 'Whether the advertisement is active',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Expiry date of the advertisement',
    required: false,
    example: '2023-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: Date;
}