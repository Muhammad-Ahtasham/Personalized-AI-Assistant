// File: /app/api/face/get-embedding-by-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        faceEmbeddings: true,
      },
    });

    if (!user || !user.faceEmbeddings) {
      return NextResponse.json({ error: 'Face embedding not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      embedding: user.faceEmbeddings,
    });
  } catch (error) {
    console.error('Get embedding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
