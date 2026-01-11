import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(
    createUserDto: any,
    requestingUserId?: number,
    requestingUserRole?: string,
  ) {
    try {
      // Validate role creation permissions
      this.validateRoleCreation(requestingUserRole || '', createUserDto.role);

      // Hash the password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `User already exists: ${error.meta?.target || 'Record'}`,
            );
          case 'P2003': // Foreign key constraint violation
            throw new BadRequestException(
              `Foreign key constraint failed: ${error.meta?.field_name || 'Field'}`,
            );
          case 'P2025': // Record not found
            throw new NotFoundException('Record not found');
          default:
            throw new BadRequestException('Invalid request data');
        }
      }
      throw error;
    }
  }

  async findAll(role?: string, req?: Request) {
    try {
      const whereClause: any = {};
      if (role) {
        whereClause.role = role;
      }

      const users = await this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // If the users have avatar URLs, construct absolute URLs
      const usersWithAbsoluteUrls = users.map((user) => ({
        ...user,
        avatar: user.avatar
          ? this.constructAbsoluteUrl(user.avatar, req)
          : null,
      }));

      return usersWithAbsoluteUrls;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Users already exist: ${error.meta?.target || 'Record'}`,
            );
          case 'P2003': // Foreign key constraint violation
            throw new BadRequestException(
              `Foreign key constraint failed: ${error.meta?.field_name || 'Field'}`,
            );
          case 'P2025': // Record not found
            throw new NotFoundException('Record not found');
          default:
            throw new BadRequestException('Invalid request data');
        }
      }
      throw error;
    }
  }

  async findOne(id: number, req?: Request) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // If the user has avatar URL, construct absolute URL
      const userWithAbsoluteUrl = {
        ...user,
        avatar: user.avatar
          ? this.constructAbsoluteUrl(user.avatar, req)
          : null,
      };

      return userWithAbsoluteUrl;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `User already exists: ${error.meta?.target || 'Record'}`,
            );
          case 'P2003': // Foreign key constraint violation
            throw new BadRequestException(
              `Foreign key constraint failed: ${error.meta?.field_name || 'Field'}`,
            );
          case 'P2025': // Record not found
            throw new NotFoundException('Record not found');
          default:
            throw new BadRequestException('Invalid request data');
        }
      }
      throw error;
    }
  }

  async update(
    id: number,
    updateUserDto: any,
    requestingUserId: number,
    requestingUserRole: string,
    req?: Request,
  ) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Check if trying to modify a SUPER_ADMIN user
      if (
        existingUser.role === 'SUPER_ADMIN' &&
        requestingUserRole !== 'SUPER_ADMIN'
      ) {
        throw new ForbiddenException('Cannot modify SUPER_ADMIN user');
      }

      // Validate role update permissions if role is being changed
      if (updateUserDto.role && updateUserDto.role !== existingUser.role) {
        this.validateRoleUpdate(
          requestingUserRole,
          existingUser.role,
          updateUserDto.role,
          id,
          requestingUserId,
        );
      }

      // Prevent users from updating their own role
      if (id === requestingUserId && updateUserDto.role) {
        throw new ForbiddenException('You cannot change your own role');
      }

      // Handle password update
      let updatedData = { ...updateUserDto };
      if (updateUserDto.password) {
        updatedData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      // If the user has avatar URL, construct absolute URL
      if (updatedData.avatar) {
        updatedData.avatar = this.constructAbsoluteUrl(updatedData.avatar, req);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updatedData,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `User already exists: ${error.meta?.target || 'Record'}`,
            );
          case 'P2003': // Foreign key constraint violation
            throw new BadRequestException(
              `Foreign key constraint failed: ${error.meta?.field_name || 'Field'}`,
            );
          case 'P2025': // Record not found
            throw new NotFoundException('Record not found');
          default:
            throw new BadRequestException('Invalid request data');
        }
      }
      throw error;
    }
  }

  async remove(
    id: number,
    requestingUserId: number,
    requestingUserRole: string,
  ) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Prevent deletion of SUPER_ADMIN user
      if (existingUser.role === 'SUPER_ADMIN') {
        throw new ForbiddenException('Cannot delete SUPER_ADMIN user');
      }

      // Prevent users from deleting themselves
      if (id === requestingUserId) {
        throw new ForbiddenException('You cannot delete your own account');
      }

      await this.prisma.user.delete({
        where: { id },
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `User already exists: ${error.meta?.target || 'Record'}`,
            );
          case 'P2003': // Foreign key constraint violation
            throw new BadRequestException(
              `Foreign key constraint failed: ${error.meta?.field_name || 'Field'}`,
            );
          case 'P2025': // Record not found
            throw new NotFoundException('Record not found');
          default:
            throw new BadRequestException('Invalid request data');
        }
      }
      throw error;
    }
  }

  private validateRoleCreation(requestingUserRole: string, targetRole: string) {
    // Prevent anyone from creating a SUPER_ADMIN through regular user creation
    if (targetRole === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'SUPER_ADMIN cannot be created through regular user creation',
      );
    }

    // If no requesting user role (e.g., during seeding), allow creation
    if (!requestingUserRole) {
      return;
    }

    // Define role hierarchy
    const roleHierarchy = {
      SUPER_ADMIN: ['ADMIN', 'EDITOR', 'REPORTER', 'USER'],
      ADMIN: ['EDITOR', 'REPORTER', 'USER'],
      EDITOR: ['REPORTER', 'USER'],
      REPORTER: ['USER'],
      USER: [],
    };

    // Check if the requesting user can create the target role
    if (!roleHierarchy[requestingUserRole]?.includes(targetRole)) {
      throw new ForbiddenException(
        `Insufficient permissions to create user with role: ${targetRole}. Your role: ${requestingUserRole}`,
      );
    }
  }

  private validateRoleUpdate(
    requestingUserRole: string,
    existingUserRole: string,
    targetRole: string,
    targetUserId: number,
    requestingUserId: number,
  ) {
    // Prevent anyone from updating a user to SUPER_ADMIN role
    if (targetRole === 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot update user to SUPER_ADMIN role');
    }

    // Only SUPER_ADMIN can change user roles
    if (requestingUserRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can change user roles');
    }

    // Prevent SUPER_ADMIN from being downgraded
    if (existingUserRole === 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot modify SUPER_ADMIN role');
    }

    // Prevent users from updating their own role
    if (targetUserId === requestingUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }
  }

  private constructAbsoluteUrl(relativePath: string, req?: Request): string {
    if (!req) {
      // Fallback to localhost if no request object provided
      return `http://localhost:3000${relativePath}`;
    }

    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}${relativePath}`;
  }
}
