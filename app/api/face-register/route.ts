import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Temporary storage for face embeddings (only for short-lived capture flow)
const tempFaceEmbeddings = new Map<string, number[]>();

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
    const body = await request.json();
    const { email, password, firstName, lastName, faceEmbedding, tempId } = body;

    // 💾 Temporary face capture storage only
    if (faceEmbedding && !email) {
      const validation = validateEmbedding(faceEmbedding);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.message }, { status: 400 });
      }

      const tempId = Date.now().toString();
      tempFaceEmbeddings.set(tempId, faceEmbedding);

      return NextResponse.json({
        success: true,
        tempId,
        message: 'Face captured successfully',
      });
    }

    // 🧍 Final face + user registration
    if (email && password && faceEmbedding) {
      const validation = validateEmbedding(faceEmbedding);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.message }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }

      // const hashedPassword = await bcrypt.hash(password, 12);
      const hashedPassword = password;

      // Check if Clerk user exists
      let clerkUser = null;
      try {
        const clerk = await clerkClient();
        const result = await clerk.users.getUserList({ emailAddress: [email] });
        if (result.data?.length) {
          clerkUser = result.data[0];
        }
      } catch (err) {
        console.error('Error checking Clerk user:', err);
      }

      // Transaction to store user + face embedding
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: firstName || null,
            lastName: lastName || null,
            clerkId: clerkUser?.id || null,
          },
        });

        const faceEmbeddingRecord = await tx.faceEmbedding.create({
          data: {
            userId: user.id,
            embedding: faceEmbedding,
          },
        });

        return { user, faceEmbeddingRecord };
      });

      // Sync with Clerk if needed
      if (!clerkUser) {
        try {
          const clerk = await clerkClient();
          const newClerkUser = await clerk.users.createUser({
            emailAddress: [email],
            password,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
          });

          await prisma.user.update({
            where: { id: result.user.id },
            data: { clerkId: newClerkUser.id },
          });

          return NextResponse.json({
            success: true,
            message: 'User registered with face and Clerk',
            user: {
              id: result.user.id,
              email: result.user.email,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              clerkId: newClerkUser.id,
            },
          });
        } catch (err) {
          console.error('Clerk user creation failed:', err);
        }
      }

      // If Clerk already existed, just return
      return NextResponse.json({
        success: true,
        message: 'User registered successfully with face',
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          clerkId: clerkUser?.id ?? null,
        },
      });
    }

    // 🧪 Retrieve temp embedding (not typically used now)
    if (tempId && !faceEmbedding) {
      const stored = tempFaceEmbeddings.get(tempId);
      if (stored) {
        tempFaceEmbeddings.delete(tempId);
        return NextResponse.json({ success: true, faceEmbedding: stored });
      }
      return NextResponse.json({ error: 'Face embedding not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Face register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
