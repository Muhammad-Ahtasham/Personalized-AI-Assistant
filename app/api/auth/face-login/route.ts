import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // In a real implementation, you would create a session or token here
    // For now, we'll redirect to dashboard with a success parameter
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('faceLogin', 'success');
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error during face login redirect:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
} 