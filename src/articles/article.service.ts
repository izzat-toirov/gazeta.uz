import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException as ConflictExceptionNest,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async create(createArticleDto: any, authorId: number, req?: Request) {
    try {
      // Validate category exists
      if (createArticleDto.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: createArticleDto.categoryId },
        });
        if (!category) {
          throw new NotFoundException(
            `Category with ID ${createArticleDto.categoryId} not found`,
          );
        }
      }

      // Validate author exists
      const author = await this.prisma.user.findUnique({
        where: { id: authorId },
      });
      if (!author) {
        throw new NotFoundException(`Author with ID ${authorId} not found`);
      }

      // Validate newspaper exists if provided
      if (createArticleDto.newspaperId) {
        const newspaper = await this.prisma.newspaper.findUnique({
          where: { id: createArticleDto.newspaperId },
        });
        if (!newspaper) {
          throw new NotFoundException(
            `Newspaper with ID ${createArticleDto.newspaperId} not found`,
          );
        }
      }

      const article = await this.prisma.article.create({
        data: {
          ...createArticleDto,
          authorId, // Use the authorId from the authenticated user
          viewCount: 0,
        },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          newspaper: true,
        },
      });

      // If the article has image URLs, construct absolute URLs
      const articleWithAbsoluteUrls = {
        ...article,
        thumbnail: article.thumbnail
          ? this.constructAbsoluteUrl(article.thumbnail, req)
          : null,
      };

      return articleWithAbsoluteUrls;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictExceptionNest(
              `Article with this slug already exists: ${error.meta?.target || 'Record'}`,
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

  async findAll(query: QueryArticleDto, req?: Request) {
    try {
      const {
        page = '1',
        limit = '10',
        categoryId,
        authorId,
        isPublished,
        newspaperId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const pageInt = parseInt(page, 10) || 1;
      const limitInt = parseInt(limit, 10) || 10;
      const skip = (pageInt - 1) * limitInt;

      const whereClause: any = {};

      if (categoryId) whereClause.categoryId = parseInt(categoryId, 10);
      if (authorId) whereClause.authorId = parseInt(authorId, 10);
      if (isPublished !== undefined)
        whereClause.isPublished = isPublished === 'true';
      if (newspaperId) whereClause.newspaperId = parseInt(newspaperId, 10);

      if (search) {
        whereClause.OR = [
          { titleUz: { contains: search, mode: 'insensitive' } },
          { titleRu: { contains: search, mode: 'insensitive' } },
          { contentUz: { contains: search, mode: 'insensitive' } },
          { contentRu: { contains: search, mode: 'insensitive' } },
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'viewCount') {
        orderBy.viewCount = sortOrder;
      } else {
        orderBy.createdAt = sortOrder;
      }

      const [articles, total] = await Promise.all([
        this.prisma.article.findMany({
          where: whereClause,
          skip,
          take: limitInt,
          orderBy,
          include: {
            category: true,
            author: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            newspaper: true,
          },
        }),
        this.prisma.article.count({ where: whereClause }),
      ]);

      // If the articles have image URLs, construct absolute URLs
      const articlesWithAbsoluteUrls = articles.map((article) => ({
        ...article,
        thumbnail: article.thumbnail
          ? this.constructAbsoluteUrl(article.thumbnail, req)
          : null,
      }));

      return {
        data: articlesWithAbsoluteUrls,
        meta: {
          page: pageInt,
          limit: limitInt,
          total,
          pages: Math.ceil(total / limitInt),
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictExceptionNest(
              `Articles already exist: ${error.meta?.target || 'Record'}`,
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
      const article = await this.prisma.article.findUnique({
        where: { id },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          newspaper: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!article) {
        throw new NotFoundException(`Article with ID ${id} not found`);
      }

      // Increment view count
      await this.prisma.article.update({
        where: { id },
        data: {
          viewCount: { increment: 1 },
        },
      });

      // If the article has image URLs, construct absolute URLs
      const articleWithAbsoluteUrls = {
        ...article,
        thumbnail: article.thumbnail
          ? this.constructAbsoluteUrl(article.thumbnail, req)
          : null,
      };

      return articleWithAbsoluteUrls;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictExceptionNest(
              `Article already exists: ${error.meta?.target || 'Record'}`,
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

  async findBySlug(slug: string, req?: Request) {
    try {
      const article = await this.prisma.article.findUnique({
        where: { slug },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          newspaper: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!article) {
        throw new NotFoundException(`Article with slug ${slug} not found`);
      }

      // Increment view count
      await this.prisma.article.update({
        where: { slug },
        data: {
          viewCount: { increment: 1 },
        },
      });

      // If the article has image URLs, construct absolute URLs
      const articleWithAbsoluteUrls = {
        ...article,
        thumbnail: article.thumbnail
          ? this.constructAbsoluteUrl(article.thumbnail, req)
          : null,
      };

      return articleWithAbsoluteUrls;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictExceptionNest(
              `Article already exists: ${error.meta?.target || 'Record'}`,
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
    updateArticleDto: UpdateArticleDto,
    requestingUserId: number,
    requestingUserRole: string,
    req?: Request,
  ) {
    try {
      // Check if article exists
      const existingArticle = await this.prisma.article.findUnique({
        where: { id },
      });

      if (!existingArticle) {
        throw new NotFoundException(`Article with ID ${id} not found`);
      }

      // Check if the requesting user is the author or has SUPER_ADMIN role
      if (
        requestingUserRole !== 'SUPER_ADMIN' &&
        requestingUserRole !== 'ADMIN' &&
        requestingUserRole !== 'EDITOR' &&
        existingArticle.authorId !== requestingUserId
      ) {
        throw new BadRequestException('You can only update your own articles');
      }

      // Validate category exists if it's being updated
      if (updateArticleDto.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: updateArticleDto.categoryId },
        });
        if (!category) {
          throw new NotFoundException(
            `Category with ID ${updateArticleDto.categoryId} not found`,
          );
        }
      }

      // Validate newspaper exists if it's being updated
      if (updateArticleDto.newspaperId) {
        const newspaper = await this.prisma.newspaper.findUnique({
          where: { id: updateArticleDto.newspaperId },
        });
        if (!newspaper) {
          throw new NotFoundException(
            `Newspaper with ID ${updateArticleDto.newspaperId} not found`,
          );
        }
      }

      const article = await this.prisma.article.update({
        where: { id },
        data: updateArticleDto,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          newspaper: true,
        },
      });

      // If the article has image URLs, construct absolute URLs
      const articleWithAbsoluteUrls = {
        ...article,
        thumbnail: article.thumbnail
          ? this.constructAbsoluteUrl(article.thumbnail, req)
          : null,
      };

      return articleWithAbsoluteUrls;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictExceptionNest(
              `Article with this slug already exists: ${error.meta?.target || 'Record'}`,
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
      // Check if article exists
      const existingArticle = await this.prisma.article.findUnique({
        where: { id },
      });

      if (!existingArticle) {
        throw new NotFoundException(`Article with ID ${id} not found`);
      }

      // Check if the requesting user is the author or has SUPER_ADMIN role
      if (
        requestingUserRole !== 'SUPER_ADMIN' &&
        requestingUserRole !== 'ADMIN' &&
        requestingUserRole !== 'EDITOR' &&
        existingArticle.authorId !== requestingUserId
      ) {
        throw new BadRequestException('You can only delete your own articles');
      }

      await this.prisma.article.delete({
        where: { id },
      });

      return { message: 'Article deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictExceptionNest(
              `Article already exists: ${error.meta?.target || 'Record'}`,
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
