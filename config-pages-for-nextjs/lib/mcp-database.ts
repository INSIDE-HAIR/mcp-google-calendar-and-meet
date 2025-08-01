// Database utility functions for MCP operations with Prisma
import { prisma } from './prisma';
import type { 
  CreateUserInput, 
  CreateMeetSpaceInput, 
  CreateCalendarEventInput, 
  LogMcpRequestInput,
  UserWithApiKeys,
  MeetSpaceWithRecords,
  ConferenceRecordWithDetails,
  CalendarEventWithDetails
} from '@/types/mcp';

// User operations
export async function createUser(data: CreateUserInput) {
  return await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      googleCredentials: data.googleCredentials,
      tokenPath: data.tokenPath
    }
  });
}

export async function getUserByEmail(email: string): Promise<UserWithApiKeys | null> {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      apiKeys: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      },
      mcpRequests: {
        orderBy: { timestamp: 'desc' },
        take: 10 // Last 10 requests
      }
    }
  });
}

export async function getUserById(id: string): Promise<UserWithApiKeys | null> {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      apiKeys: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      },
      mcpRequests: {
        orderBy: { timestamp: 'desc' },
        take: 10
      }
    }
  });
}

export async function updateUserCredentials(userId: string, credentials: string, tokenPath?: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      googleCredentials: credentials,
      tokenPath,
      updatedAt: new Date()
    }
  });
}

// MCP Request logging
export async function logMcpRequest(data: LogMcpRequestInput) {
  return await prisma.mcpRequest.create({
    data: {
      userId: data.userId,
      toolName: data.toolName,
      arguments: data.arguments,
      response: data.response,
      success: data.success,
      errorMsg: data.errorMsg,
      duration: data.duration,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress
    }
  });
}

export async function getMcpRequestsByUser(userId: string, limit = 50) {
  return await prisma.mcpRequest.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });
}

export async function getMcpAnalytics(timeRange = '7d') {
  const days = timeRange === '30d' ? 30 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totalRequests, successfulRequests, toolsUsage] = await Promise.all([
    prisma.mcpRequest.count({
      where: {
        timestamp: { gte: startDate }
      }
    }),
    prisma.mcpRequest.count({
      where: {
        timestamp: { gte: startDate },
        success: true
      }
    }),
    prisma.mcpRequest.groupBy({
      by: ['toolName'],
      where: {
        timestamp: { gte: startDate }
      },
      _count: {
        toolName: true
      },
      _max: {
        timestamp: true
      },
      orderBy: {
        _count: {
          toolName: 'desc'
        }
      }
    })
  ]);

  return {
    totalRequests,
    successfulRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    toolsUsage: toolsUsage.map(tool => ({
      _id: tool.toolName,
      count: tool._count.toolName,
      lastUsed: tool._max.timestamp!
    })),
    timeRange,
    generatedAt: new Date()
  };
}

// Meet Space operations
export async function createMeetSpace(data: CreateMeetSpaceInput) {
  return await prisma.meetSpace.create({
    data: {
      spaceName: data.spaceName,
      meetingUri: data.meetingUri,
      accessType: data.accessType || 'TRUSTED',
      createdBy: data.createdBy,
      enableRecording: data.enableRecording || false,
      enableTranscription: data.enableTranscription || false,
      enableSmartNotes: data.enableSmartNotes || false,
      moderationMode: data.moderationMode || 'OFF',
      chatRestriction: data.chatRestriction || 'NO_RESTRICTION',
      presentRestriction: data.presentRestriction || 'NO_RESTRICTION'
    }
  });
}

export async function getMeetSpaceByName(spaceName: string): Promise<MeetSpaceWithRecords | null> {
  return await prisma.meetSpace.findUnique({
    where: { spaceName },
    include: {
      conferenceRecords: {
        orderBy: { startTime: 'desc' },
        take: 10
      }
    }
  });
}

export async function getMeetSpacesByUser(userId: string) {
  return await prisma.meetSpace.findMany({
    where: { createdBy: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      conferenceRecords: {
        orderBy: { startTime: 'desc' },
        take: 5
      }
    }
  });
}

// Conference Record operations
export async function createConferenceRecord(
  spaceName: string,
  conferenceRecordName: string,
  startTime?: Date,
  endTime?: Date
) {
  // First find the space
  const space = await prisma.meetSpace.findUnique({
    where: { spaceName }
  });

  if (!space) {
    throw new Error(`Meet space ${spaceName} not found`);
  }

  return await prisma.conferenceRecord.create({
    data: {
      conferenceRecordName,
      spaceId: space.id,
      startTime,
      endTime,
      duration: startTime && endTime ? 
        Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 
        undefined
    }
  });
}

export async function getConferenceRecordWithDetails(
  conferenceRecordName: string
): Promise<ConferenceRecordWithDetails | null> {
  return await prisma.conferenceRecord.findUnique({
    where: { conferenceRecordName },
    include: {
      space: true,
      recordings: {
        orderBy: { startTime: 'desc' }
      },
      transcripts: {
        orderBy: { startTime: 'desc' },
        include: {
          entries: {
            orderBy: { startTime: 'asc' },
            take: 100 // Limit to first 100 entries
          }
        }
      },
      participants: {
        include: {
          participantSessions: {
            orderBy: { startTime: 'asc' }
          }
        }
      }
    }
  });
}

// Calendar Event operations
export async function createCalendarEvent(data: CreateCalendarEventInput) {
  return await prisma.calendarEvent.create({
    data: {
      eventId: data.eventId,
      summary: data.summary,
      description: data.description,
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      timeZone: data.timeZone,
      createdBy: data.createdBy,
      meetConference: data.meetConference || false,
      meetingUri: data.meetingUri,
      guestCanInviteOthers: data.guestCanInviteOthers || true,
      guestCanModify: data.guestCanModify || false,
      guestCanSeeOtherGuests: data.guestCanSeeOtherGuests || true,
      attendees: data.attendees || []
    }
  });
}

export async function getCalendarEventsByUser(userId: string, limit = 50): Promise<CalendarEventWithDetails[]> {
  const events = await prisma.calendarEvent.findMany({
    where: { createdBy: userId },
    orderBy: { startTime: 'desc' },
    take: limit
  });

  return events.map(event => ({
    ...event,
    attendees: event.attendees as string[] // Cast JSON to string array
  }));
}

export async function updateCalendarEvent(eventId: string, data: Partial<CreateCalendarEventInput>) {
  return await prisma.calendarEvent.update({
    where: { eventId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

// Analytics and statistics
export async function getDashboardStats(userId?: string) {
  const whereClause = userId ? { createdBy: userId } : {};

  const [
    totalUsers,
    totalApiKeys,
    activeApiKeys,
    totalMeetSpaces,
    totalCalendarEvents,
    recentRequests
  ] = await Promise.all([
    prisma.user.count(),
    prisma.apiKey.count(),
    prisma.apiKey.count({ where: { isActive: true } }),
    prisma.meetSpace.count(userId ? { where: whereClause } : {}),
    prisma.calendarEvent.count(userId ? { where: whereClause } : {}),
    prisma.mcpRequest.count({
      where: {
        ...(userId && { userId }),
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  ]);

  return {
    totalUsers,
    totalApiKeys,
    activeApiKeys,
    totalMeetSpaces,
    totalCalendarEvents,
    recentRequests,
    generatedAt: new Date()
  };
}