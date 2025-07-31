import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("Simple face auth for:", email);

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

    console.log("User found:", {
      id: user.id,
      email: user.email,
      hasClerkId: !!user.clerkId,
      passwordType: user.password ? (user.password.startsWith('$2b$') ? 'hashed' : 'plain') : 'none'
    });

    // For now, let's just return the user info and let the frontend handle Clerk
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        clerkId: user.clerkId,
        firstName: user.firstName,
        lastName: user.lastName,
        needsClerkSetup: !user.clerkId,
      },
    });

  } catch (error) {
    console.error('Simple face auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 