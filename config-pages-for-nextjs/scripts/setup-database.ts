#!/usr/bin/env tsx
// Database setup script for Google Meet MCP Server with Prisma

import { PrismaClient } from '@prisma/client';
import { initializeDatabase } from '../lib/prisma';

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🚀 Starting database setup...');

  try {
    // Initialize database connection
    await initializeDatabase();

    // Create test user if needed
    const existingUsers = await prisma.user.count();
    
    if (existingUsers === 0) {
      console.log('👤 Creating test user...');
      
      const testUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User'
        }
      });

      console.log(`✅ Test user created: ${testUser.email} (ID: ${testUser.id})`);

      // Create a test API key
      const testApiKey = await prisma.apiKey.create({
        data: {
          userId: testUser.id,
          apiKey: 'test-api-key-' + Math.random().toString(36).substring(7),
          isActive: true
        }
      });

      console.log(`🔑 Test API key created: ${testApiKey.apiKey}`);
    } else {
      console.log(`👥 Found ${existingUsers} existing users`);
    }

    // Check collections
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.apiKey.count(),
      prisma.mcpRequest.count(),
      prisma.meetSpace.count(),
      prisma.calendarEvent.count()
    ]);

    console.log('\n📊 Database Statistics:');
    console.log(`  Users: ${stats[0]}`);
    console.log(`  API Keys: ${stats[1]}`);
    console.log(`  MCP Requests: ${stats[2]}`);
    console.log(`  Meet Spaces: ${stats[3]}`);
    console.log(`  Calendar Events: ${stats[4]}`);

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Set DATABASE_URL in your .env file');
    console.log('  2. Run `npx prisma generate` to generate the client');
    console.log('  3. Start your Next.js application');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});