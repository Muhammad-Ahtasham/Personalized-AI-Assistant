import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("Debug face auth for:", email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Step 1: Find user in database
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

    console.log("Step 1 - User in database:", user ? {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      hasClerkId: !!user.clerkId,
      passwordLength: user.password?.length
    } : "Not found");

    if (!user) {
      return NextResponse.json({
        step: "user_not_found",
        error: 'User not found in database'
      }, { status: 404 });
    }

    // Step 2: Check if user has Clerk ID
    if (user.clerkId) {
      console.log("Step 2 - User has Clerk ID:", user.clerkId);
      
      try {
        // Step 3: Try to get Clerk user
        const { clerkClient } = await import('@clerk/nextjs/server');
        const clerk = await clerkClient();
        
        const clerkUser = await clerk.users.getUser(user.clerkId);
        console.log("Step 3 - Clerk user found:", {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          hasPassword: !!clerkUser.passwordEnabled
        });

        return NextResponse.json({
          step: "clerk_user_found",
          success: true,
          user: {
            id: user.id,
            email: user.email,
            clerkId: user.clerkId,
            hasClerkPassword: !!clerkUser.passwordEnabled,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      } catch (clerkError) {
        console.error("Step 3 - Clerk user error:", clerkError);
        return NextResponse.json({
          step: "clerk_user_error",
          error: 'Failed to get Clerk user',
          details: clerkError instanceof Error ? clerkError.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      console.log("Step 2 - User has no Clerk ID, would create one");
      return NextResponse.json({
        step: "no_clerk_id",
        success: true,
        user: {
          id: user.id,
          email: user.email,
          clerkId: null,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    }

  } catch (error) {
    console.error('Debug face auth error:', error);
    return NextResponse.json(
      { 
        step: "general_error",
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 