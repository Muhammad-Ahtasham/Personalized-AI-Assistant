import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to save quiz results." },
      { status: 401 }
    );
  }
  const { topic, questions, answers, score, clerkId } = await req.json();
  if (!topic || !questions || !answers || typeof score !== 'number' || !clerkId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  try {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await prisma.user.create({ data: { clerkId } });
    }
    // Save quiz result
    const result = await prisma.quizResult.create({
      data: {
        topic,
        questions,
        answers,
        score,
        userId: user.id,
      },
    });
    return NextResponse.json({ result });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Failed to save quiz result." }, { status: 500 });
  }
} 