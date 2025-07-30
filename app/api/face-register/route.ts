import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { faceEmbedding } = await request.json();

    if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
      return NextResponse.json({ error: "Invalid face embedding" }, { status: 400 });
    }

    // Update user with face embedding
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        faceEmbedding: JSON.stringify(faceEmbedding),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering face:", error);
    return NextResponse.json({ error: "Failed to register face" }, { status: 500 });
  }
} 