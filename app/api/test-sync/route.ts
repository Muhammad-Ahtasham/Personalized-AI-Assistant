import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the current Clerk user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User exists in database',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          clerkId: existingUser.clerkId,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'User not found in database',
        clerkId: userId,
      });
    }

  } catch (error) {
    console.error('Test sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 