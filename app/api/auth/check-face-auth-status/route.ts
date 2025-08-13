import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        faceEmbeddings: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasFaceAuth = user.faceEmbeddings.length > 0;

    return NextResponse.json({
      success: true,
      hasFaceAuth,
      faceAuthCount: user.faceEmbeddings.length,
      lastSetupDate: hasFaceAuth ? user.faceEmbeddings[0].createdAt : null,
    });
  } catch (error) {
    console.error('Check face auth status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
