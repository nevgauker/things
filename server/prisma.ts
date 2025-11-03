import { PrismaClient } from '@prisma/client';

type GlobalPrisma = { prisma?: PrismaClient };
const globalForPrisma = global as unknown as GlobalPrisma;

function createClient(): PrismaClient {
  if (process.env.PRISMA_ACCELERATE_URL) {
    try {
      // Lazy load to avoid build-time hard dependency
      // Avoid bundlers resolving this at build time
      // eslint-disable-next-line no-eval
      const dynamicRequire: NodeRequire = eval('require');
      const { withAccelerate } = dynamicRequire('@prisma/extension-accelerate');
      const extended = new PrismaClient().$extends(withAccelerate());
      return extended as unknown as PrismaClient;
    } catch (e) {
      // Fallback to standard client if extension not installed
      return new PrismaClient();
    }
  }
  return new PrismaClient();
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  (globalForPrisma as any).prisma = prisma;
}
