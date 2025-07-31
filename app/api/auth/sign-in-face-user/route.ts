import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("Direct sign-in for face user:", email);

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

    // If user doesn't have a Clerk ID, create one
    if (!user.clerkId) {
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.createUser({
          emailAddress: [email],
          password: tempPassword,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        });

        // Update user in database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            clerkId: clerkUser.id,
            password: tempPassword,
          },
        });

        console.log("Created new Clerk user for face authentication");
      } catch (clerkError) {
        console.error('Failed to create Clerk user:', clerkError);
        return NextResponse.json(
          { error: 'Failed to create Clerk user' },
          { status: 500 }
        );
      }
    } else {
      // Update existing user's password for authentication
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUser(user.clerkId, {
          password: tempPassword,
        });

        // Update user in database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: tempPassword,
          },
        });

        console.log("Updated existing Clerk user password for face authentication");
      } catch (clerkError) {
        console.error('Failed to update Clerk user password:', clerkError);
        return NextResponse.json(
          { error: 'Failed to update Clerk user password' },
          { status: 500 }
        );
      }
    }

    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
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

    return NextResponse.json({
      success: true,
      message: 'Face user authenticated successfully',
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        clerkId: updatedUser!.clerkId,
        password: updatedUser!.password, // This is now a plain text password
        firstName: updatedUser!.firstName,
        lastName: updatedUser!.lastName,
      },
    });

  } catch (error) {
    console.error('Sign-in face user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 