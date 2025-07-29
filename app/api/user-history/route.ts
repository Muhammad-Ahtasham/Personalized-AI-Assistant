import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: NextRequest) {
  const { clerkId } = await req.json();
  if (!clerkId) {
    return NextResponse.json({ error: "Missing clerkId." }, { status: 400 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        learningPlans: { orderBy: { createdAt: "desc" } },
        quizResults: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!user) {
      return NextResponse.json({ plans: [], quizzes: [] });
    }
    return NextResponse.json({ plans: user.learningPlans, quizzes: user.quizResults });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Failed to fetch history." }, { status: 500 });
  }
} 