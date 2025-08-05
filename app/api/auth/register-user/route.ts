import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        clerkId: clerkUser?.id || null,
      },
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
          where: { id: user.id },
          data: {
            clerkId: newClerkUser.id,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'User registered successfully',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            clerkId: newClerkUser.id,
          },
        });
      } catch (clerkError) {
        console.error('Failed to create Clerk user:', clerkError);
        // If Clerk user creation fails, still return success but without clerkId
        return NextResponse.json({
          success: true,
          message: 'User registered successfully (Clerk user creation failed)',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            clerkId: null,
          },
        });
      }
    } else {
      // Clerk user already exists, just update the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          clerkId: clerkUser.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          clerkId: clerkUser.id,
        },
      });
    }

  } catch (error) {
    console.error('User registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 