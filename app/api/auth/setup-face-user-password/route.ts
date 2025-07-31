import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("Setting up password for face user:", email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        clerkId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a consistent password for face users
    // In production, you might want to use a more secure method
    const facePassword = "FaceAuth2024!";

    try {
      // Import clerkClient dynamically
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerk = await clerkClient();

      if (user.clerkId) {
        // Update existing Clerk user password
        await clerk.users.updateUser(user.clerkId, {
          password: facePassword,
        });
        console.log("Updated existing Clerk user password");
      } else {
        // Create new Clerk user
        const clerkUser = await clerk.users.createUser({
          emailAddress: [email],
          password: facePassword,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        });

        // Update user in database with Clerk ID
        await prisma.user.update({
          where: { id: user.id },
          data: {
            clerkId: clerkUser.id,
          },
        });
        console.log("Created new Clerk user");
      }

      return NextResponse.json({
        success: true,
        message: 'Password set up successfully',
        password: facePassword,
      });

    } catch (clerkError) {
      console.error('Failed to set up password:', clerkError);
      return NextResponse.json(
        { error: 'Failed to set up password' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Setup face user password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 