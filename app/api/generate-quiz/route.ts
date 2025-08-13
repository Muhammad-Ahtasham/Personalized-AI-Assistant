import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Generate Quiz API called');

    // Check authentication
    const { userId } = await auth();
    console.log('Auth check result - userId:', userId ? 'present' : 'missing');

    if (!userId) {
      console.log('Authentication failed - no userId');
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to generate quizzes.' },
        { status: 401 }
      );
    }

    const { topic } = await req.json();
    console.log('Generate Quiz for topic:', topic);

    if (!topic) {
      console.log('No topic provided');
      return NextResponse.json({ error: 'No topic provided.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('OpenRouter API key check:', apiKey ? 'Set' : 'Not set');

    if (!apiKey) {
      console.error('OpenRouter API key not set in environment variables');
      return NextResponse.json(
        {
          error: 'OpenRouter API key not set. Please check your deployment configuration.',
        },
        { status: 500 }
      );
    }

    console.log('Making request to OpenRouter for quiz with topic:', topic);

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
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
                "You are an expert study assistant. Given a topic, generate a short interactive quiz (5 questions) from beginner to advanced level. Return the quiz as a JSON array of objects with 'question', 'choices' (array), and 'answer' (string). Do not include explanations unless asked.",
            },
            {
              role: 'user',
              content: `Generate a quiz for: ${topic}`,
            },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('OpenRouter response status:', openRouterRes.status);

      if (!openRouterRes.ok) {
        const errorText = await openRouterRes.text();
        console.error('OpenRouter error response:', errorText);
        return NextResponse.json(
          {
            error: `OpenRouter API error (${openRouterRes.status}): ${errorText}`,
          },
          { status: 500 }
        );
      }

      const data = await openRouterRes.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';
      console.log('AI Response received, length:', aiResponse.length);

      // Try to parse the quiz from the AI's response
      let quiz = null;
      try {
        // First try to parse as JSON
        quiz = JSON.parse(aiResponse);
        console.log('Successfully parsed quiz as JSON');
      } catch {
        console.log('Failed to parse as JSON, treating as string');
        // If parsing fails, try to extract JSON from the response
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            quiz = JSON.parse(jsonMatch[1]);
            console.log('Successfully extracted and parsed JSON from markdown');
          } catch {
            console.log('Failed to extract JSON from markdown');
            quiz = [];
          }
        } else {
          console.log('No JSON found in response');
          quiz = [];
        }
      }

      console.log('Final quiz:', quiz);

      // Ensure quiz is an array
      if (!Array.isArray(quiz)) {
        console.log('Quiz is not an array, setting to empty array');
        quiz = [];
      }

      console.log('Returning quiz response');
      return NextResponse.json({ quiz });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return NextResponse.json(
          {
            error: 'Request timeout. Please try again.',
          },
          { status: 408 }
        );
      }
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error in generate-quiz API:', error);
    return NextResponse.json(
      {
        error: `Server error: ${error.message || 'Failed to fetch from OpenRouter.'}`,
      },
      { status: 500 }
    );
  }
}
