import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, faceEmbedding } = await request.json();

    // Validate required fields
    if (!email || !password || !faceEmbedding) {
      return NextResponse.json(
        { error: 'Email, password, and face embedding are required' },
        { status: 400 }
      );
    }

    // Check if user already exists in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and face embedding in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user in Prisma first
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
        },
      });

      // Create the face embedding
      const faceEmbeddingRecord = await tx.faceEmbedding.create({
        data: {
          userId: user.id,
          embedding: faceEmbedding,
        },
      });

      return { user, faceEmbeddingRecord };
    });

    // Create Clerk user
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      // Update user in database with Clerk ID
      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          clerkId: clerkUser.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User registered successfully with face authentication',
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          clerkId: clerkUser.id,
        },
      });
    } catch (clerkError) {
      console.error('Failed to create Clerk user:', clerkError);
      // If Clerk user creation fails, still return success but without clerkId
      return NextResponse.json({
        success: true,
        message: 'User registered successfully with face authentication (Clerk user creation failed)',
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          clerkId: null,
        },
      });
    }

  } catch (error) {
    console.error('Face registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 