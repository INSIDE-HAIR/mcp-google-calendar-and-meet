// API Key Management for Google Meet MCP Server with Prisma
import { prisma } from './prisma';
import type { ApiKey } from '@/types/mcp';
import crypto from 'crypto';

export interface ApiKeyData {
  id: string;
  key: string;
  createdAt: Date;
}

export async function generateApiKey(userId: string): Promise<ApiKeyData> {
  // Generate secure API key
  const apiKey = crypto.randomBytes(32).toString('hex');
  
  const apiKeyDoc = await prisma.apiKey.create({
    data: {
      userId,
      apiKey,
      isActive: true,
      usageCount: 0
    }
  });
  
  return {
    id: apiKeyDoc.id,
    key: apiKeyDoc.apiKey,
    createdAt: apiKeyDoc.createdAt
  };
}

export async function verifyApiKey(apiKey: string): Promise<{ userId: string } | null> {
  const keyDoc = await prisma.apiKey.findFirst({
    where: {
      apiKey,
      isActive: true
    }
  });
  
  if (!keyDoc) {
    return null;
  }
  
  // Update last used timestamp and usage count
  await prisma.apiKey.update({
    where: { id: keyDoc.id },
    data: {
      lastUsed: new Date(),
      usageCount: { increment: 1 }
    }
  });
  
  return { userId: keyDoc.userId };
}

export async function revokeApiKey(apiKeyId: string, userId: string): Promise<boolean> {
  try {
    const result = await prisma.apiKey.updateMany({
      where: {
        id: apiKeyId,
        userId
      },
      data: {
        isActive: false,
        revokedAt: new Date()
      }
    });
    
    return result.count > 0;
  } catch (error) {
    console.error('Error revoking API key:', error);
    return false;
  }
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  
  return keys.map(key => ({
    id: key.id,
    userId: key.userId,
    apiKey: key.apiKey,
    apiKeyPreview: `${key.apiKey.slice(0, 8)}...${key.apiKey.slice(-4)}`,
    fullApiKey: key.apiKey,
    createdAt: key.createdAt,
    lastUsed: key.lastUsed,
    isActive: key.isActive,
    usageCount: key.usageCount
  }));
}

export async function getApiKeyStats(): Promise<{
  totalKeys: number;
  activeKeys: number;
  recentlyActive: number;
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [totalKeys, activeKeys, recentlyActive] = await Promise.all([
    prisma.apiKey.count(),
    prisma.apiKey.count({
      where: { isActive: true }
    }),
    prisma.apiKey.count({
      where: {
        isActive: true,
        lastUsed: { gte: thirtyDaysAgo }
      }
    })
  ]);
  
  return {
    totalKeys,
    activeKeys,
    recentlyActive
  };
}