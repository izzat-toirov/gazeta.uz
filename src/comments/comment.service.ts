import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createCommentDto: CreateCommentDto) {
    try {
      // Verify that user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Verify that article exists and is published
      const article = await this.prisma.article.findUnique({
        where: {
          id: createCommentDto.articleId,
          isPublished: true,
        },
      });
      if (!article) {
        throw new NotFoundException(
          `Article with ID ${createCommentDto.articleId} not found or not published`,
        );
      }

      const comment = await this.prisma.comment.create({
        data: {
          ...createCommentDto,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          article: {
            select: {
              id: true,
              titleUz: true,
              slug: true,
            },
          },
        },
      });

      return comment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Comment already exists: ${error.meta?.target || 'Record'}`,
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

  async findAll(articleId?: number) {
    try {
      const whereClause: any = {};

      if (articleId) {
        whereClause.articleId = articleId;
      }

      return await this.prisma.comment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          article: {
            select: {
              id: true,
              titleUz: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Comment already exists: ${error.meta?.target || 'Record'}`,
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

  async findOne(id: number) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          article: {
            select: {
              id: true,
              titleUz: true,
              slug: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException(`Comment with ID ${id} not found`);
      }

      return comment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Comment already exists: ${error.meta?.target || 'Record'}`,
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

  async update(id: number, userId: number, updateCommentDto: UpdateCommentDto) {
    try {
      // Check if comment exists
      const comment = await this.prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        throw new NotFoundException(`Comment with ID ${id} not found`);
      }

      // Only allow updating if it's the user's own comment or if user is admin/editor
      if (comment.userId !== userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (
          !user ||
          (user.role !== 'ADMIN' &&
            user.role !== 'EDITOR' &&
            user.role !== 'SUPER_ADMIN')
        ) {
          throw new ForbiddenException('You can only update your own comments');
        }
      }

      const updatedComment = await this.prisma.comment.update({
        where: { id },
        data: updateCommentDto,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          article: {
            select: {
              id: true,
              titleUz: true,
              slug: true,
            },
          },
        },
      });

      return updatedComment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Comment already exists: ${error.meta?.target || 'Record'}`,
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

  async remove(id: number, userId: number, userRole: string) {
    try {
      // Check if comment exists
      const comment = await this.prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        throw new NotFoundException(`Comment with ID ${id} not found`);
      }

      // SUPER_ADMIN can delete any comment
      if (userRole === 'SUPER_ADMIN') {
        await this.prisma.comment.delete({
          where: { id },
        });
        return { message: 'Comment deleted successfully' };
      }

      // Only allow deleting if it's the user's own comment or if user is admin/editor
      if (comment.userId !== userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
          throw new ForbiddenException('You can only delete your own comments');
        }
      }

      await this.prisma.comment.delete({
        where: { id },
      });

      return { message: 'Comment deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Comment already exists: ${error.meta?.target || 'Record'}`,
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
}
