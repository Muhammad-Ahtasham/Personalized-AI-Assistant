import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
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
      console.error("OpenRouter API key not set in environment variables");
      return NextResponse.json({ 
        error: "OpenRouter API key not set. Please check your deployment configuration." 
      }, { status: 500 });
    }

    console.log("Making request to OpenRouter with topic:", topic);

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
            content: "You are an expert educator and curriculum designer. Create a step-by-step personalized learning plan that takes me from a complete beginner to an advanced level in the given topic. The plan should be divided into stages (beginner, intermediate, advanced) and include the Key concepts and skills to master at each stage, the Recommended learning resources (books, courses, websites, videos, etc.), the Practical exercises or projects to reinforce learning, the Estimated timelines for each stage, the Tips for staying motivated and avoiding common mistakes, and Optionally suggested communities or forums to join for support. Make it structured, clear, and actionable. IMPORTANT: Use plain text only - do not use any markdown formatting like **, ###, or ---. Use clear headings and bullet points without special characters. If you cannot generate a proper plan, respond with 'FAILED_TO_GENERATE_PLAN'.",
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

    console.log("OpenRouter response status:", openRouterRes.status);

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      console.error("OpenRouter error response:", errorText);
      return NextResponse.json({ 
        error: `OpenRouter API error (${openRouterRes.status}): ${errorText}` 
      }, { status: 500 });
    }

    const data = await openRouterRes.json();
    console.log("OpenRouter response data received");
    
    const plan = data.choices?.[0]?.message?.content || "";
    console.log("Generated plan length:", plan.length);
    
    // Validate the generated plan
    if (!plan || 
        plan.trim() === "" || 
        plan.toLowerCase().includes("failed_to_generate_plan") ||
        plan.toLowerCase().includes("no plan generated") ||
        plan.toLowerCase().includes("i cannot") ||
        plan.toLowerCase().includes("i'm unable") ||
        plan.length < 100) {
      console.log("Plan validation failed - plan too short or contains failure indicators");
      return NextResponse.json({ 
        error: "Failed to generate a proper learning plan. Please try again with a different topic or check your internet connection." 
      }, { status: 500 });
    }
    
    console.log("Plan validation passed, returning plan");
    return NextResponse.json({ plan });
  } catch (err) {
    const error = err as Error;
    console.error("Error in generate-plan API:", error);
    return NextResponse.json({ 
      error: `Server error: ${error.message || "Failed to fetch from OpenRouter."}` 
    }, { status: 500 });
  }
} 