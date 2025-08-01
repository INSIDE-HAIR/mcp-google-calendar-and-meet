// Prisma client configuration for Google Meet MCP Server
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper functions for database operations
export async function ensureDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB with Prisma:', error);
    throw new Error('Database connection failed');
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌 Prisma disconnected from MongoDB');
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Database initialization function
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing database...');
    
    // Ensure connection
    await ensureDatabaseConnection();
    
    // Test basic operations
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export default prisma;