import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("Authenticate face user request for:", email);

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

    console.log("Found user in database:", user ? { id: user.id, email: user.email, hasClerkId: !!user.clerkId } : "Not found");

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user has a Clerk ID, we need to create a session
    if (user.clerkId) {
      console.log("User has Clerk ID, but we need to provide a password for authentication");
      
      // For users with existing Clerk ID, we need to create a temporary password
      // since the stored password is hashed and can't be used with Clerk
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      try {
        // Import clerkClient dynamically
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();

        // Update the user's password in Clerk
        await clerk.users.updateUser(user.clerkId, {
          password: tempPassword,
        });

        // Update user in database with temporary password
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            password: tempPassword,
          },
        });

        console.log("Updated existing user with temp password");

        return NextResponse.json({
          success: true,
          hasClerkId: true,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            clerkId: updatedUser.clerkId,
            password: tempPassword, // Return temporary password for authentication
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
          },
        });
      } catch (clerkError) {
        console.error('Failed to update Clerk user password:', clerkError);
        return NextResponse.json(
          { error: 'Failed to update Clerk user password' },
          { status: 500 }
        );
      }
    }

    // If user doesn't have a Clerk ID, we need to create one
    // But we can't use the hashed password directly with Clerk
    // So we'll create a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    console.log("Creating Clerk user with temp password for:", email);

    try {
      // Import clerkClient dynamically
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerk = await clerkClient();

      // Create Clerk user with temporary password
      const clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        password: tempPassword,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      });

      console.log("Clerk user created:", clerkUser.id);

      // Update user in database with Clerk ID and temporary password
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          clerkId: clerkUser.id,
          password: tempPassword, // Store temporary password for authentication
        },
      });

      console.log("User updated in database with Clerk ID");

      return NextResponse.json({
        success: true,
        hasClerkId: false,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          clerkId: updatedUser.clerkId,
          password: tempPassword, // Return temporary password for authentication
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        },
      });

    } catch (clerkError) {
      console.error('Failed to create Clerk user:', clerkError);
      return NextResponse.json(
        { error: 'Failed to create Clerk user' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Authenticate face user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 