// Next.ts 15 App Router - Google Credentials Setup
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { credentials } = await request.json();

    // Validate credentials format
    if (!credentials.client_id || !credentials.client_secret) {
      return NextResponse.json(
        {
          error:
            "Invalid credentials format. Must contain client_id and client_secret",
        },
        { status: 400 }
      );
    }

    // Encrypt credentials before storing
    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    // Store in MongoDB
    const { db } = await connectToDatabase();
    await db.collection("users").updateOne(
      { _id: session.user.id },
      {
        $set: {
          googleCredentials: encryptedCredentials,
          googleCredentialsUpdatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google credentials setup error:", error);
    return NextResponse.json(
      { error: "Failed to store credentials" },
      { status: 500 }
    );
  }
}
