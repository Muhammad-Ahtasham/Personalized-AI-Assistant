import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cosineSimilarity } from "../../../lib/face-utils";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { faceEmbedding, email } = await request.json();

    if (!faceEmbedding || !Array.isArray(faceEmbedding) || !email) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        clerkId: {
          contains: email, // This is a simplified approach - in production you'd want a proper email field
        },
      },
    });

    if (!user || !user.faceEmbedding) {
      return NextResponse.json({ error: "User not found or no face registered" }, { status: 404 });
    }

    // Parse stored embedding
    const storedEmbedding = JSON.parse(user.faceEmbedding);
    
    // Calculate similarity
    const similarity = cosineSimilarity(faceEmbedding, storedEmbedding);
    
    // Threshold for face recognition (0.6 is a good starting point)
    const threshold = 0.6;
    
    if (similarity >= threshold) {
      return NextResponse.json({ 
        success: true, 
        userId: user.clerkId,
        similarity 
      });
    } else {
      return NextResponse.json({ 
        error: "Face not recognized", 
        similarity 
      }, { status: 401 });
    }
  } catch (error) {
    console.error("Error during face login:", error);
    return NextResponse.json({ error: "Face authentication failed" }, { status: 500 });
  }
} 