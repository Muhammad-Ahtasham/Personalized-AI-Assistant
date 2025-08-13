import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check environment variables
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const databaseUrl = process.env.DATABASE_URL;
    const clerkSecret = process.env.CLERK_SECRET_KEY;

    const config = {
      openRouterKey: openRouterKey ? 'Set' : 'Not set',
      databaseUrl: databaseUrl ? 'Set' : 'Not set',
      clerkSecret: clerkSecret ? 'Set' : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    // Test OpenRouter API if key is available
    let openRouterTest = 'Not tested';
    if (openRouterKey) {
      try {
        const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1:free',
            messages: [
              {
                role: 'user',
                content: "Say 'Hello'",
              },
            ],
            max_tokens: 10,
          }),
        });

        if (testResponse.ok) {
          openRouterTest = 'Working';
        } else {
          const errorText = await testResponse.text();
          openRouterTest = `Error: ${testResponse.status} - ${errorText}`;
        }
      } catch (error) {
        openRouterTest = `Connection failed: ${error}`;
      }
    }

    return NextResponse.json({
      success: true,
      config,
      openRouterTest,
    });
  } catch (error) {
    console.error('Error in test-config:', error);
    return NextResponse.json({ error: 'Failed to test configuration' }, { status: 500 });
  }
}
