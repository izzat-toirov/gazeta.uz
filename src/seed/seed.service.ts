import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../utils/bcrypt.util';
import { Role } from '@prisma/client';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSuperAdminExists();
  }

  private async ensureSuperAdminExists() {
    try {
      // Check if any SUPER_ADMIN user exists
      const superAdminUser = await this.prisma.user.findFirst({
        where: { role: Role.SUPER_ADMIN },
      });

      if (!superAdminUser) {
        const superAdminEmail =
          process.env.SUPER_ADMIN_EMAIL || 'admin@sirdaryohaqqiqati.uz';
        const superAdminPassword =
          process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

        this.logger.log('Creating Super Admin account...');

        // Hash the password
        const hashedPassword = await hashPassword(superAdminPassword);

        // Create the super admin user
        const superAdmin = await this.prisma.user.create({
          data: {
            email: superAdminEmail,
            fullName: 'Super Admin',
            password: hashedPassword,
            role: Role.SUPER_ADMIN, // Changed from ADMIN to SUPER_ADMIN
          },
        });

        this.logger.log(`Super Admin created with email: ${superAdminEmail}`);
        this.logger.warn(
          `Default password is: ${superAdminPassword}. Please change it immediately!`,
        );
      } else {
        this.logger.log('Super Admin already exists. Skipping initialization.');
      }
    } catch (error) {
      this.logger.error(
        `Error during Super Admin initialization: ${error.message}`,
      );
      throw error;
    }
  }
}
