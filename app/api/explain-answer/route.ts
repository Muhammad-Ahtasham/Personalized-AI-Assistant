import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { question, answer, userAnswer, topic } = await req.json();

  if (!question || !answer || !topic) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
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
            content: "You are an expert tutor. When a student gets a quiz question wrong, provide a clear, concise explanation of why the correct answer is right and why the student's answer might be wrong. Keep explanations brief but helpful.",
          },
          {
            role: "user",
            content: `Question: ${question}\nCorrect Answer: ${answer}\nStudent's Answer: ${userAnswer || 'No answer provided'}\nTopic: ${topic}\n\nPlease explain why the correct answer is right.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!openRouterRes.ok) {
      const error = await openRouterRes.text();
      return NextResponse.json({ error: `OpenRouter error: ${error}` }, { status: 500 });
    }

    const data = await openRouterRes.json();
    const explanation = data.choices?.[0]?.message?.content || "No explanation available.";
    return NextResponse.json({ explanation });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Failed to fetch explanation." }, { status: 500 });
  }
} 