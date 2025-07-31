import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Test if we can access Clerk client
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({
      limit: 1,
    });

    return NextResponse.json({
      success: true,
      message: 'Clerk client is working',
      userCount: users.length,
    });
  } catch (error) {
    console.error('Clerk test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Clerk client error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 