import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

type GlobalPrisma = { prisma?: PrismaClient };
const globalForPrisma = global as unknown as GlobalPrisma;

function createClient(): PrismaClient {
  if (process.env.PRISMA_ACCELERATE_URL) {
    // Enable Accelerate only when configured
    const extended = new PrismaClient().$extends(withAccelerate());
    return extended as unknown as PrismaClient;
  }
  return new PrismaClient();
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  (globalForPrisma as any).prisma = prisma;
}
