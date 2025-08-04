import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    return NextResponse.json({
      success: true,
      message: 'Simple API is working',
      userId: userId || 'not authenticated',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });

  } catch (error) {
    console.error('Simple API error:', error);
    return NextResponse.json(
      { 
        error: 'Simple API error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Simple API POST is working',
      receivedData: requestBody,
      userId: userId || 'not authenticated',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Simple API POST error:', error);
    return NextResponse.json(
      { 
        error: 'Simple API POST error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 