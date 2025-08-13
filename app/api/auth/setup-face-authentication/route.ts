import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Utility to validate and normalize an embedding
function validateEmbedding(embedding: number[]): { valid: boolean; message?: string } {
  if (!Array.isArray(embedding)) {
    return { valid: false, message: 'Embedding is not an array.' };
  }

  if (embedding.length !== 128) {
    return { valid: false, message: `Embedding must be 128 floats. Got: ${embedding.length}` };
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude < 0.9 || magnitude > 1.1) {
    return {
      valid: false,
      message: `Embedding not normalized (magnitude = ${magnitude.toFixed(2)}). Ensure it's pre-normalized.`,
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // const { faceEmbedding } = await request.json();
    const body = await request.json();
    const { faceEmbedding } = body;

    if (!faceEmbedding) {
      return NextResponse.json({ error: 'Face embedding is required' }, { status: 400 });
    }

    // Validate the embedding
    const validation = validateEmbedding(faceEmbedding);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    // Find the user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        clerkId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has face authentication
    const existingFaceEmbedding = await prisma.faceEmbedding.findFirst({
      where: { userId: user.id },
    });

    if (existingFaceEmbedding) {
      return NextResponse.json(
        { error: 'Face authentication is already set up for this user' },
        { status: 409 }
      );
    }

    // Create face embedding record
    const faceEmbeddingRecord = await prisma.faceEmbedding.create({
      data: {
        userId: user.id,
        embedding: faceEmbedding,
      },
    });

    console.log('Face Embedding', faceEmbeddingRecord ? 'Created' : 'Not Created');

    return NextResponse.json({
      success: true,
      message: 'Face authentication set up successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        clerkId: user.clerkId,
      },
    });
  } catch (error) {
    console.error('Setup face authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
