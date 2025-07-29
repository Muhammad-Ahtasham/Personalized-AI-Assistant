import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const { topic, content, clerkId } = await req.json();
  if (!topic || !content || !clerkId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  try {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await prisma.user.create({ data: { clerkId } });
    }
    // Save learning plan
    const plan = await prisma.learningPlan.create({
      data: {
        topic,
        content,
        userId: user.id,
      },
    });
    return NextResponse.json({ plan });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Failed to save plan." }, { status: 500 });
  }
} 