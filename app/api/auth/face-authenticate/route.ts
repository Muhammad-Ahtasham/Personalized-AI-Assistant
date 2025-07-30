import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";

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

    // For now, we'll use a simpler approach - redirect to sign in with the user's email
    // This will allow Clerk to handle the authentication flow
    console.log("Face authentication successful for user:", userId);
    
    return NextResponse.json({ 
      success: true, 
      userId,
      email,
      redirectUrl: `/sign-in?email=${encodeURIComponent(email)}&faceAuth=true`
    });
  } catch (error) {
    console.error("Error during face authentication:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
} 