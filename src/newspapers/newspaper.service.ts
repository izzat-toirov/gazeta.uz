import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';

export interface QueryNewspaperDto {
  page?: string;
  limit?: string;
  fromDate?: string;
  toDate?: string;
}

@Injectable()
export class NewspaperService {
  constructor(private prisma: PrismaService) {}

  async create(createNewspaperDto: any) {
    try {
      const newspaper = await this.prisma.newspaper.create({
        data: createNewspaperDto,
      });

      return newspaper;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Newspaper already exists: ${error.meta?.target || 'Record'}`,
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

  async findAll(query?: QueryNewspaperDto, req?: Request) {
    try {
      const { page = '1', limit = '10', fromDate, toDate } = query || {};

      const pageInt = parseInt(page, 10) || 1;
      const limitInt = parseInt(limit, 10) || 10;
      const skip = (pageInt - 1) * limitInt;

      const whereClause: any = {};

      if (fromDate || toDate) {
        whereClause.issueDate = {};
        if (fromDate) {
          whereClause.issueDate.gte = new Date(fromDate);
        }
        if (toDate) {
          whereClause.issueDate.lte = new Date(toDate);
        }
      }

      const [newspapers, total] = await Promise.all([
        this.prisma.newspaper.findMany({
          where: whereClause,
          skip,
          take: limitInt,
          orderBy: {
            issueDate: 'desc',
          },
        }),
        this.prisma.newspaper.count({ where: whereClause }),
      ]);

      // If the newspapers have image URLs, construct absolute URLs
      const newspapersWithAbsoluteUrls = newspapers.map((newspaper) => ({
        ...newspaper,
        coverImage: newspaper.coverImage
          ? this.constructAbsoluteUrl(newspaper.coverImage, req)
          : null,
        pdfUrl: newspaper.pdfUrl
          ? this.constructAbsoluteUrl(newspaper.pdfUrl, req)
          : null,
      }));

      return {
        data: newspapersWithAbsoluteUrls,
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
            throw new ConflictException(
              `Newspapers already exist: ${error.meta?.target || 'Record'}`,
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
      const newspaper = await this.prisma.newspaper.findUnique({
        where: { id },
      });

      if (!newspaper) {
        throw new NotFoundException(`Newspaper with ID ${id} not found`);
      }

      // If the newspaper has image URLs, construct absolute URLs
      const newspaperWithAbsoluteUrls = {
        ...newspaper,
        coverImage: newspaper.coverImage
          ? this.constructAbsoluteUrl(newspaper.coverImage, req)
          : null,
        pdfUrl: newspaper.pdfUrl
          ? this.constructAbsoluteUrl(newspaper.pdfUrl, req)
          : null,
      };

      return newspaperWithAbsoluteUrls;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Newspaper already exists: ${error.meta?.target || 'Record'}`,
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

  async update(id: number, updateNewspaperDto: any) {
    try {
      // Check if newspaper exists
      const existingNewspaper = await this.prisma.newspaper.findUnique({
        where: { id },
      });

      if (!existingNewspaper) {
        throw new NotFoundException(`Newspaper with ID ${id} not found`);
      }

      const updatedNewspaper = await this.prisma.newspaper.update({
        where: { id },
        data: updateNewspaperDto,
      });

      return updatedNewspaper;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Newspaper already exists: ${error.meta?.target || 'Record'}`,
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

  async remove(id: number) {
    try {
      // Check if newspaper exists
      const existingNewspaper = await this.prisma.newspaper.findUnique({
        where: { id },
      });

      if (!existingNewspaper) {
        throw new NotFoundException(`Newspaper with ID ${id} not found`);
      }

      // Check if there are articles associated with this newspaper
      const articlesCount = await this.prisma.article.count({
        where: { newspaperId: id },
      });

      if (articlesCount > 0) {
        throw new ConflictException(
          'Cannot delete newspaper that has associated articles',
        );
      }

      await this.prisma.newspaper.delete({
        where: { id },
      });

      return { message: 'Newspaper deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Newspaper already exists: ${error.meta?.target || 'Record'}`,
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
