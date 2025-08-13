import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'success',
      message: 'API is working correctly',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      openRouterKey: process.env.OPENROUTER_API_KEY ? 'Set' : 'Not set',
      clerkKey: process.env.CLERK_SECRET_KEY ? 'Set' : 'Not set',
    });
  } catch (error) {
    console.error('Test deploy error:', error);
    return NextResponse.json({ status: 'error', error: 'Test endpoint failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      status: 'success',
      message: 'POST request received',
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test deploy POST error:', error);
    return NextResponse.json({ status: 'error', error: 'POST test failed' }, { status: 500 });
  }
}
