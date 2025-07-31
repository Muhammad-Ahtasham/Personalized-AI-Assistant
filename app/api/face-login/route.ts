import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Function to calculate cosine similarity between two embeddings
function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

export async function POST(request: NextRequest) {
  try {
    const { faceEmbedding } = await request.json();

    if (!faceEmbedding) {
      return NextResponse.json(
        { error: 'Face embedding is required' },
        { status: 400 }
      );
    }

    // Get all face embeddings from the database
    const faceEmbeddings = await prisma.faceEmbedding.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            clerkId: true,
            password: true,
          },
        },
      },
    });

    let bestMatch = null;
    let highestSimilarity = 0;
    const similarityThreshold = 0.6; // Adjust this threshold as needed

    // Compare the provided embedding with all stored embeddings
    for (const storedEmbedding of faceEmbeddings) {
      const storedEmbeddingArray = storedEmbedding.embedding as number[];
      const similarity = cosineSimilarity(faceEmbedding, storedEmbeddingArray);

      if (similarity > highestSimilarity && similarity >= similarityThreshold) {
        highestSimilarity = similarity;
        bestMatch = storedEmbedding;
      }
    }

    if (!bestMatch) {
      return NextResponse.json(
        { error: 'Face not recognized. Please try again or register first.' },
        { status: 401 }
      );
    }

    // Return user information for Clerk authentication
    return NextResponse.json({
      success: true,
      message: 'Face authentication successful',
      user: {
        id: bestMatch.user.id,
        email: bestMatch.user.email,
        firstName: bestMatch.user.firstName,
        lastName: bestMatch.user.lastName,
        clerkId: bestMatch.user.clerkId,
        password: bestMatch.user.password, // Include password for Clerk auth
      },
      similarity: highestSimilarity,
    });

  } catch (error) {
    console.error('Face login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 