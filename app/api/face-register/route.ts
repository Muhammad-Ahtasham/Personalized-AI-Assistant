import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Temporary storage for face embeddings (in production, use Redis or similar)
const tempFaceEmbeddings = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, faceEmbedding, tempId } = body;

    // If this is just face capture (no user data yet)
    if (faceEmbedding && !email) {
      const tempId = Date.now().toString();
      tempFaceEmbeddings.set(tempId, faceEmbedding);
      
      return NextResponse.json({
        success: true,
        tempId,
        message: 'Face captured successfully'
      });
    }

    // If this is the final registration with all user data
    if (email && password && faceEmbedding) {
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

      // Try to find existing Clerk user first
      let clerkUser = null;
      try {
        const clerk = await clerkClient();
        const usersResponse = await clerk.users.getUserList({
          emailAddress: [email],
        });
        
        if (usersResponse.data && usersResponse.data.length > 0) {
          clerkUser = usersResponse.data[0];
        }
      } catch (clerkError) {
        console.error('Error checking for existing Clerk user:', clerkError);
      }

      // Create user and face embedding in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the user in Prisma first
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: firstName || null,
            lastName: lastName || null,
            clerkId: clerkUser?.id || null,
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

      // If no Clerk user exists, create one
      if (!clerkUser) {
        try {
          const clerk = await clerkClient();
          const newClerkUser = await clerk.users.createUser({
            emailAddress: [email],
            password,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
          });

          // Update user in database with Clerk ID
          await prisma.user.update({
            where: { id: result.user.id },
            data: {
              clerkId: newClerkUser.id,
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
              clerkId: newClerkUser.id,
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
      } else {
        // Clerk user already exists (from email verification), just update the database
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
      }
    }

    // If this is retrieving a stored face embedding
    if (tempId && !faceEmbedding) {
      const storedEmbedding = tempFaceEmbeddings.get(tempId);
      if (storedEmbedding) {
        tempFaceEmbeddings.delete(tempId); // Clean up
        return NextResponse.json({
          success: true,
          faceEmbedding: storedEmbedding
        });
      } else {
        return NextResponse.json(
          { error: 'Face embedding not found or expired' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Face registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 