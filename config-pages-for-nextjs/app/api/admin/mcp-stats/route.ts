// Next.ts 15 App Router - Admin MCP Stats with Prisma
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, getMcpAnalytics } from "@/lib/mcp-database";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get comprehensive stats using Prisma
    const [dashboardStats, mcpAnalytics, recentRequests] = await Promise.all([
      getDashboardStats(),
      getMcpAnalytics('7d'),
      prisma.mcpRequest.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      totalUsers: dashboardStats.totalUsers,
      totalRequests: mcpAnalytics.totalRequests,
      activeApiKeys: dashboardStats.activeApiKeys,
      totalMeetSpaces: dashboardStats.totalMeetSpaces,
      totalCalendarEvents: dashboardStats.totalCalendarEvents,
      successRate: mcpAnalytics.successRate,
      toolsUsage: mcpAnalytics.toolsUsage,
      recentRequests: recentRequests.map(req => ({
        id: req.id,
        userId: req.userId,
        userName: req.user.name || req.user.email,
        toolName: req.toolName,
        success: req.success,
        timestamp: req.timestamp,
        duration: req.duration,
        errorMsg: req.errorMsg
      })),
      generatedAt: new Date()
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
