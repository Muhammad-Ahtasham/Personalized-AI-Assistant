import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the current Clerk user
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Update the user in database with Clerk ID
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        clerkId: clerkUserId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User synced to Clerk successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        clerkId: updatedUser.clerkId,
      },
    });

  } catch (error) {
    console.error('Sync user to Clerk error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 