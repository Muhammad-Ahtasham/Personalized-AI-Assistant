import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get user from database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the learning plan
    const deletedPlan = await prisma.learningPlan.delete({
      where: {
        id: planId,
        userId: user.id, // Ensure user can only delete their own plans
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Learning plan deleted successfully',
      deletedPlan,
    });
  } catch (error) {
    console.error('Error deleting learning plan:', error);

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Learning plan not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'Failed to delete learning plan' }, { status: 500 });
  }
}
