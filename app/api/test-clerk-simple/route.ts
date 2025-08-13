import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if we can import clerkClient
    await import('@clerk/nextjs/server');

    return NextResponse.json({
      success: true,
      message: 'Clerk client initialized successfully',
    });
  } catch (error) {
    console.error('Clerk test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Clerk client initialization error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
