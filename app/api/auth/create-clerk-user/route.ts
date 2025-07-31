import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName } = await request.json();
    console.log("Create Clerk user request:", { email, firstName, lastName });

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    console.log("Existing user found:", existingUser);

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    if (existingUser.clerkId) {
      return NextResponse.json(
        { error: 'User already has a Clerk ID' },
        { status: 409 }
      );
    }

    // Generate a temporary password for Clerk user
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    console.log("Generated temp password:", tempPassword);

    // Create Clerk user with temporary password
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.createUser({
      emailAddress: [email],
      password: tempPassword,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });

    console.log("Clerk user created:", clerkUser);

    // Update user in database with Clerk ID and temporary password
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        clerkId: clerkUser.id,
        password: tempPassword, // Store temporary password for authentication
      },
    });

    console.log("User updated in database:", updatedUser);

    return NextResponse.json({
      success: true,
      message: 'Clerk user created successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        clerkId: updatedUser.clerkId,
        password: tempPassword, // Return temporary password for authentication
      },
    });

  } catch (error) {
    console.error('Create Clerk user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 