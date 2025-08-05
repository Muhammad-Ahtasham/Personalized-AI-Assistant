import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: "API is working on Netlify!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      url: request.url,
      method: request.method,
    });
  } catch (error) {
    console.error("Test deploy error:", error);
    return NextResponse.json(
      { error: "Test deploy failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: "POST API is working on Netlify!",
      timestamp: new Date().toISOString(),
      receivedData: body,
    });
  } catch (error) {
    console.error("Test deploy POST error:", error);
    return NextResponse.json(
      { error: "Test deploy POST failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 