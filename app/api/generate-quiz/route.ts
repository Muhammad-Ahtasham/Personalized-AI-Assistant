import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

console.log("Generate Quiz...")
export async function POST(req: NextRequest) {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to generate quizzes." },
      { status: 401 }
    );
  }

  const { topic } = await req.json();
    console.log("Topic ", topic)
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
    const aiResponse = data.choices?.[0]?.message?.content || "";
    console.log("AI Response:", aiResponse);
    
    // Try to parse the quiz from the AI's response
    let quiz = null;
    try {
      // First try to parse as JSON
      quiz = JSON.parse(aiResponse);
      console.log("Successfully parsed quiz as JSON");
    } catch (parseError) {
      console.log("Failed to parse as JSON, treating as string");
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          quiz = JSON.parse(jsonMatch[1]);
          console.log("Successfully extracted and parsed JSON from markdown");
        } catch (extractError) {
          console.log("Failed to extract JSON from markdown");
          quiz = [];
        }
      } else {
        console.log("No JSON found in response");
        quiz = [];
      }
    }
    
    console.log("Final quiz:", quiz);
    
    // Ensure quiz is an array
    if (!Array.isArray(quiz)) {
      console.log("Quiz is not an array, setting to empty array");
      quiz = [];
    }
    
    return NextResponse.json({ quiz });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Failed to fetch from OpenRouter." }, { status: 500 });
  }
} 