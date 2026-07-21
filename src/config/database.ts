import { PrismaClient } from '@prisma/client';
import { ENV } from './env';

// Menyimpan instance Prisma di global object agar tidak terbuat berulang kali saat tsx me-restart server
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (ENV.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;