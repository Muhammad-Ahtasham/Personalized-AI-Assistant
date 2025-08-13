import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleApiError, createErrorResponse } from '../error-handler';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile API is working',
      userId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return handleApiError(error, 'Test profile API');
  }
}

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      message: 'Profile API POST is working',
      receivedData: requestBody,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, 'Test profile API POST');
  }
}
