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

    const { quizId } = await request.json();

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    // Get user from database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the quiz result
    const deletedQuiz = await prisma.quizResult.delete({
      where: {
        id: quizId,
        userId: user.id, // Ensure user can only delete their own quiz results
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz result deleted successfully',
      deletedQuiz,
    });
  } catch (error) {
    console.error('Error deleting quiz result:', error);

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Quiz result not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'Failed to delete quiz result' }, { status: 500 });
  }
}
