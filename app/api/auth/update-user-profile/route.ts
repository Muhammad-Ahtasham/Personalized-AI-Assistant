import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { handleApiError, createErrorResponse } from '../../error-handler';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Get the current Clerk user
    const { userId } = await auth();

    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { firstName, lastName, imageUrl } = requestBody;

    // Validate input
    if (!firstName && !lastName && !imageUrl) {
      return createErrorResponse('At least one field must be provided', 400);
    }

    // Update user in Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();

    const updateData: Record<string, string> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    await clerk.users.updateUser(userId, updateData);

    if (imageUrl) {
      const res = await fetch(imageUrl);
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });

      await clerk.users.updateUserProfileImage(userId, { file: blob });
    }

    // Update user in database
    const dbUpdateData: Record<string, string> = {};
    if (firstName !== undefined) dbUpdateData.firstName = firstName;
    if (lastName !== undefined) dbUpdateData.lastName = lastName;
    if (imageUrl !== undefined) dbUpdateData.imageUrl = imageUrl;

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
    return handleApiError(error, 'Update user profile');
  }
}
