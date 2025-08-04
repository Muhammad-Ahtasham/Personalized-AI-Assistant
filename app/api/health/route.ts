import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      openRouterKey: process.env.OPENROUTER_API_KEY ? "Set" : "Not set",
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { status: "unhealthy", error: "Health check failed" },
      { status: 500 }
    );
  }
} 