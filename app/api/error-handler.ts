import { NextResponse } from 'next/server';

export function handleApiError(error: unknown, context: string = 'API') {
  console.error(`${context} error:`, error);

  // Check for Prisma connection errors
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes('Prisma') || errorMessage.includes('database')) {
    return NextResponse.json(
      {
        error: 'Database connection error',
        message: 'Unable to connect to database. Please try again.',
      },
      { status: 503 }
    );
  }

  // Return a proper JSON error response
  return NextResponse.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong',
    },
    { status: 500 }
  );
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}
