import { NextResponse } from 'next/server';

export function handleApiError(error: any, context: string = 'API') {
  console.error(`${context} error:`, error);
  
  // Return a proper JSON error response
  return NextResponse.json(
    { 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    },
    { status: 500 }
  );
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message },
    { status }
  );
} 