import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user from database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete failed plans
    const failedPlans = await prisma.learningPlan.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { content: { contains: 'No plan generated' } },
          { content: { contains: 'FAILED_TO_GENERATE_PLAN' } },
          { content: { contains: 'Failed to generate' } },
          { content: { contains: 'no plan generated' } },
          { content: { contains: 'failed to generate' } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${failedPlans.count} failed learning plans`,
      deletedCount: failedPlans.count,
    });
  } catch (error) {
    console.error('Error cleaning up failed plans:', error);
    return NextResponse.json({ error: 'Failed to clean up failed plans' }, { status: 500 });
  }
}
