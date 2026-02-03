import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Singleton PrismaClient instance.
 * This ensures only one database connection pool exists across the application,
 * shared between the auth module and NestJS services.
 */
let prismaClientInstance: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaClientInstance) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    prismaClientInstance = new PrismaClient({ adapter });
  }
  return prismaClientInstance;
};

// Re-export for type usage
export { PrismaClient } from '../../generated/prisma/client';
