import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ description: 'User password', example: 'securePassword123' })
  @IsString()
  @Length(6, 100)
  password: string;

  @ApiProperty({
    description: 'User avatar URL',
    required: false,
    example: 'https://matrypqgmxvxgdhfgyjx.supabase.co/storage/v1/object/public/uploads/images/1768108855560-images.png',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: 'User role', enum: Role, example: Role.USER })
  @IsEnum(Role)
  role: Role;
}
