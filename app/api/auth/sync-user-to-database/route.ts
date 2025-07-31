import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get the current Clerk user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists in database',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          clerkId: existingUser.clerkId,
        },
      });
    }

    // Get user details from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found in Clerk' },
        { status: 404 }
      );
    }

    // Get primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      return NextResponse.json(
        { error: 'No primary email found' },
        { status: 400 }
      );
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: primaryEmail.emailAddress,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
      },
    });

    console.log(`User synced to database: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'User synced to database successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        clerkId: newUser.clerkId,
      },
    });

  } catch (error) {
    console.error('Sync user to database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 