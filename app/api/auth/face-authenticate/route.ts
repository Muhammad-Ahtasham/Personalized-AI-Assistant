import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get the user from Prisma
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        clerkId: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user has a Clerk ID, they can use traditional sign-in
    if (user.clerkId) {
      return NextResponse.json({
        success: true,
        hasClerkId: true,
        message: 'User exists in Clerk, use traditional sign-in',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          clerkId: user.clerkId,
        },
      });
    }

    // If user doesn't have a Clerk ID, they need to create one
    // For now, we'll return a message indicating they should use traditional sign-in
    return NextResponse.json({
      success: true,
      hasClerkId: false,
      message: 'User needs to complete traditional sign-in first',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

  } catch (error) {
    console.error('Face authenticate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 