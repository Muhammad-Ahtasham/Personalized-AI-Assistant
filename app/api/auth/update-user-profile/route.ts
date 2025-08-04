import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Get the current Clerk user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { firstName, lastName, imageUrl } = await request.json();
    


    // Validate input
    if (!firstName && !lastName && !imageUrl) {
      return NextResponse.json(
        { error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    // Update user in Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;


    await clerk.users.updateUser(userId, updateData);

    // Update user in database
    const dbUpdateData: any = {};
    if (firstName !== undefined) dbUpdateData.firstName = firstName;
    if (lastName !== undefined) dbUpdateData.lastName = lastName;

    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: dbUpdateData,
    });

    console.log(`User profile updated: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        clerkId: updatedUser.clerkId,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      },
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 