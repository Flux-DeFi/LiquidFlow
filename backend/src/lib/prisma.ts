import { PrismaClient } from '../generated/prisma/index.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch {
    // In Prisma 7 client engine mode, adapter or accelerateUrl is required
    return new PrismaClient({
      accelerateUrl: process.env.PRISMA_ACCELERATE_URL || 'prisma://accelerate.net/?api_key=local',
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

