import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword } from '../utils/bcrypt.util';
import { Role } from '@prisma/client';
import { ForbiddenException as CustomForbiddenException } from '../common/exceptions/forbidden.exception';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Don't allow registration with SUPER_ADMIN role
    if (registerDto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot register with SUPER_ADMIN role');
    }

    // Hash the password
    const hashedPassword = await hashPassword(registerDto.password);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        fullName: registerDto.fullName,
        password: hashedPassword,
        avatar: registerDto.avatar,
        role: registerDto.role || Role.USER,
      },
    });

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Return user object without password and with access token
    const { password: _, ...result } = user;
    return {
      user: result,
      access_token: accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare passwords using bcrypt
    const isPasswordValid = await this.comparePasswords(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Return user object without password and with access token
    const { password: _, ...result } = user;
    return {
      user: result,
      access_token: accessToken,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.default.compare(plainTextPassword, hashedPassword);
  }

  // Helper method to ensure only one Super Admin exists
  async ensureSingleSuperAdmin() {
    const superAdminCount = await this.prisma.user.count({
      where: { role: Role.SUPER_ADMIN },
    });

    return superAdminCount <= 1;
  }
}
