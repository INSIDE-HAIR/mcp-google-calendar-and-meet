// Next.ts 15 App Router - Generate API Key
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-keys";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const apiKey = await generateApiKey(session.user.id);

    return NextResponse.json({
      success: true,
      apiKey: apiKey.key,
      keyId: apiKey.id,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error("Generate API Key Error:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}
