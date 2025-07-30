import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, userId, email } = await request.json();

    if (!token || !userId || !email) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a session that will work with our custom auth system
    const sessionToken = `face_auth_${Date.now()}_${userId}`;
    console.log("Creating face auth session:", sessionToken);
    
    // Set the session cookie
    const response = NextResponse.json({ 
      success: true, 
      sessionToken,
      userId,
      email 
    });
    
    // Set the face auth session cookie
    response.cookies.set('face_auth_session', sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    // Clear the temporary cookie
    response.cookies.set('temp_face_auth', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    });
    
    console.log("Face auth session created successfully");
    return response;
  } catch (error) {
    console.error("Error creating face session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
} 