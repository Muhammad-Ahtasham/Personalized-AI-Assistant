import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to get explanations.' },
        { status: 401 }
      );
    }

    const { question, answer, userAnswer, topic } = await req.json();
    console.log('Explain answer request:', { question, answer, userAnswer, topic });

    if (!question || !answer || !topic) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not set.' }, { status: 500 });
    }

    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: [
            {
              role: 'system',
              content:
                "You are an expert tutor. When a student gets a quiz question wrong, provide a clear, concise explanation of why the correct answer is right and why the student's answer might be wrong. Keep explanations brief but helpful.",
            },
            {
              role: 'user',
              content: `Question: ${question}\nCorrect Answer: ${answer}\nStudent's Answer: ${userAnswer || 'No answer provided'}\nTopic: ${topic}\n\nPlease explain why the correct answer is right.`,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!openRouterRes.ok) {
        const error = await openRouterRes.text();
        return NextResponse.json({ error: `OpenRouter error: ${error}` }, { status: 500 });
      }

      const data = await openRouterRes.json();
      const explanation = data.choices?.[0]?.message?.content || 'No explanation available.';
      console.log('Explanation generated:', explanation);
      return NextResponse.json({ explanation });
    } catch (err) {
      // clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('Explanation request timeout');
        return NextResponse.json(
          {
            error: 'Request timeout. Please try again.',
          },
          { status: 408 }
        );
      }
      const error = err as Error;
      console.error('Error in explain-answer API:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch explanation.' },
        { status: 500 }
      );
    }
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Authentication error.' }, { status: 500 });
  }
}
