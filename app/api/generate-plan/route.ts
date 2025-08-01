import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to generate learning plans." },
      { status: 401 }
    );
  }

  const { topic } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "No topic provided." }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter API key not set." }, { status: 500 });
  }

  try {
    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free", // You can change to the specific DeepSeek model if needed
        messages: [
          {
            role: "system",
            content: "You are an expert study assistant. Given a topic, generate a detailed, step-by-step personalized learning plan for a beginner. Use clear, actionable steps and include resources or tips if possible.",
          },
          {
            role: "user",
            content: `Generate a personalized learning plan for: ${topic}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!openRouterRes.ok) {
      const error = await openRouterRes.text();
      return NextResponse.json({ error: `OpenRouter error: ${error}` }, { status: 500 });
    }

    const data = await openRouterRes.json();
    const plan = data.choices?.[0]?.message?.content || "No plan generated.";
    return NextResponse.json({ plan });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Failed to fetch from OpenRouter." }, { status: 500 });
  }
} 