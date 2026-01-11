import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';

@Injectable()
export class AdvertisementService {
  constructor(private prisma: PrismaService) {}

  async create(createAdvertisementDto: CreateAdvertisementDto) {
    try {
      const advertisement = await this.prisma.advertisement.create({
        data: {
          ...createAdvertisementDto,
        },
      });

      return advertisement;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Advertisement already exists: ${error.meta?.target || 'Record'}`,
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

  async findAll(isActive?: boolean, req?: Request) {
    try {
      const currentTime = new Date();
      const whereClause: any = {};

      // If isActive is provided, use it; otherwise default to true
      if (isActive !== undefined) {
        whereClause.isActive = isActive;
      } else {
        whereClause.isActive = true;
      }

      // Add expiry date condition
      whereClause.OR = [
        { expiryDate: null },
        { expiryDate: { gte: currentTime } },
      ];

      const advertisements = await this.prisma.advertisement.findMany({
        where: whereClause,
        orderBy: {
          id: 'desc',
        },
      });

      // If the advertisements have image URLs, construct absolute URLs
      const advertisementsWithAbsoluteUrls = advertisements.map((ad) => ({
        ...ad,
        imageUrl: ad.imageUrl
          ? this.constructAbsoluteUrl(ad.imageUrl, req)
          : ad.imageUrl,
      }));

      return advertisementsWithAbsoluteUrls;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Advertisements already exist: ${error.meta?.target || 'Record'}`,
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
      const advertisement = await this.prisma.advertisement.findUnique({
        where: { id },
      });

      if (!advertisement) {
        throw new NotFoundException(`Advertisement with ID ${id} not found`);
      }

      // If the advertisement has image URL, construct absolute URL
      const advertisementWithAbsoluteUrl = {
        ...advertisement,
        imageUrl: advertisement.imageUrl
          ? this.constructAbsoluteUrl(advertisement.imageUrl, req)
          : advertisement.imageUrl,
      };

      return advertisementWithAbsoluteUrl;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Advertisement already exists: ${error.meta?.target || 'Record'}`,
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

  async update(id: number, updateAdvertisementDto: UpdateAdvertisementDto) {
    try {
      // Check if advertisement exists
      const existingAd = await this.prisma.advertisement.findUnique({
        where: { id },
      });

      if (!existingAd) {
        throw new NotFoundException(`Advertisement with ID ${id} not found`);
      }

      const updatedAdvertisement = await this.prisma.advertisement.update({
        where: { id },
        data: updateAdvertisementDto,
      });

      return updatedAdvertisement;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Advertisement already exists: ${error.meta?.target || 'Record'}`,
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
      // Check if advertisement exists
      const existingAd = await this.prisma.advertisement.findUnique({
        where: { id },
      });

      if (!existingAd) {
        throw new NotFoundException(`Advertisement with ID ${id} not found`);
      }

      await this.prisma.advertisement.delete({
        where: { id },
      });

      return { message: 'Advertisement deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            throw new ConflictException(
              `Advertisement already exists: ${error.meta?.target || 'Record'}`,
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