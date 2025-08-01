// Next.ts 15 App Router - MCP Health Check
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "2.0",
    timestamp: new Date().toISOString(),
    services: {
      mcp: "operational",
      google_apis: "operational",
    },
  });
}

export async function POST() {
  return NextResponse.json({
    status: "healthy",
    version: "2.0",
    timestamp: new Date().toISOString(),
    message: "MCP Server is operational",
  });
}
