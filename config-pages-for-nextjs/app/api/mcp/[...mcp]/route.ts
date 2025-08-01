// Next.ts 15 App Router - MCP Handler
// This handles all MCP protocol requests from Claude Desktop
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NextJSMCPAdapter } from "@/lib/nextjs-mcp-adapter";
import { getUserGoogleCredentials, logMCPRequest } from "@/lib/mcp-utils";
import { verifyApiKey } from "@/lib/api-keys";

// CORS headers for Claude Desktop
const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    let userId = null;
    let userInfo = null;

    // Authentication Method 1: API Key (for Claude Desktop)
    const apiKey = request.headers.get("x-api-key");
    if (apiKey) {
      console.log(`🔑 API Key request: ${apiKey.slice(0, 8)}...`);

      const apiKeyInfo = await verifyApiKey(apiKey);
      if (!apiKeyInfo) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 403, headers: corsHeaders }
        );
      }

      userId = apiKeyInfo.userId;
      userInfo = apiKeyInfo;
    }

    // Authentication Method 2: Session (for web interface)
    else {
      const session = await auth();
      if (!session) {
        return NextResponse.json(
          {
            error: "Authentication required",
            message: "Either provide X-API-Key header or valid session",
          },
          { status: 401, headers: corsHeaders }
        );
      }

      userId = session.user.id;
      userInfo = session.user;
    }

    const body = await request.json();

    // Log the request for analytics
    await logMCPRequest({
      userId,
      method: body?.method,
      toolName: body?.params?.name,
      timestamp: new Date(),
      ipAddress: request.headers.get("x-forwarded-for") || request.ip,
    });

    // Get user's Google credentials
    const userCredentials = await getUserGoogleCredentials(userId);

    if (!userCredentials) {
      return NextResponse.json(
        {
          error: "Google credentials not configured",
          setupUrl: "/dashboard/google-setup",
          message: "Please configure your Google OAuth credentials first",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize MCP adapter with user's credentials
    const mcpAdapter = new NextJSMCPAdapter(userCredentials);

    // Handle the MCP request
    console.log(
      `📋 MCP Request: ${body.method} - ${body.params?.name || "N/A"}`
    );

    const mcpResponse = await mcpAdapter.handleMCPRequest(body);

    // Add metadata to response
    mcpResponse._meta = {
      userId: userId,
      timestamp: new Date().toISOString(),
      version: "2.0",
      toolsCount: mcpResponse.tools?.length || 0,
    };

    return NextResponse.json(mcpResponse, { headers: corsHeaders });
  } catch (error) {
    console.error("❌ MCP API Error:", error);

    // Don't expose internal errors to client
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
