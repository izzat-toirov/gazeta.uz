import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Hech qanday qo'shimcha parametr shart emas, Prisma DATABASE_URL ni env dan o'zi oladi
    super({
    // @ts-ignore: Prisma versiyalari o'rtasidagi tip ziddiyatini vaqtincha yopish uchun
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma 6: Baza bilan aloqa o’rnatildi');
      await this.seedSuperAdmin();
    } catch (error) {
      console.error('❌ Prisma ulanishda xato:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async seedSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@sirdaryohaqqiqati.uz';
    const adminExists = await this.user.findUnique({ where: { email } });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(
        process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
        10,
      );
      await this.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName: 'Super Admin',
          role: 'SUPER_ADMIN' as any,
        },
      });
      console.log('🚀 [SEED] Super Admin yaratildi!');
    }
  }
}