import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'admin@sirdaryohaqqiqati.uz' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'SuperAdmin123!' })
  @IsString()
  @Length(6, 100)
  password: string;
}
