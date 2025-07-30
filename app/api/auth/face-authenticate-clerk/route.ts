import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing user data" }, { status: 400 });
    }

    // Verify the user exists and has face embedding
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || !user.faceEmbedding) {
      return NextResponse.json({ error: "User not found or no face registered" }, { status: 404 });
    }

    // Create a special session that will be recognized by Clerk
    const sessionToken = `clerk_session_${Date.now()}_${userId}`;
    console.log("Creating Clerk-compatible session:", sessionToken);
    
    // Set the session cookie that Clerk will recognize
    const response = NextResponse.json({ 
      success: true, 
      sessionToken,
      userId,
      email 
    });
    
    // Set multiple cookies to ensure Clerk recognizes the session
    response.cookies.set('__session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    // Also set the face auth session for backward compatibility
    response.cookies.set('face_auth_session', sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    console.log("Clerk-compatible session created");
    return response;
  } catch (error) {
    console.error("Error during face authentication:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
} 