import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: "You are an expert study assistant. Given a topic, generate a short interactive quiz (3-5 questions) for a beginner. Return the quiz as a JSON array of objects with 'question', 'choices' (array), and 'answer' (string). Do not include explanations unless asked.",
          },
          {
            role: "user",
            content: `Generate a quiz for: ${topic}`,
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
    // Try to parse the quiz from the AI's response
    let quiz = null;
    try {
      quiz = JSON.parse(data.choices?.[0]?.message?.content || "[]");
    } catch {
      quiz = data.choices?.[0]?.message?.content || [];
    }
    return NextResponse.json({ quiz });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch from OpenRouter." }, { status: 500 });
  }
} 