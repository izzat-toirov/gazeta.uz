import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/UpdateProfileDto.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User has been successfully registered.',
  })
  @ApiBadRequestResponse({
    description: 'Validation error or invalid input.',
  })
  @ApiConflictResponse({
    description: 'User with this email already exists.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully logged in.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials.',
  })
  @ApiBadRequestResponse({
    description: 'Validation error or invalid input.',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns current user profile data.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - Invalid or expired token.',
  })
  async getProfile(@GetUser('id') userId: number) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  @UseGuards(JwtAuthGuard) // Faqat tizimga kirganlar uchun
  async updateProfile(
    @GetUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    // @GetUser orqali kelgan user.sub yoki user.id ni ishlatamiz
    return this.authService.updateProfile(
      user.id || user.sub,
      updateProfileDto,
    );
  }
}
