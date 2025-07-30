import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get all users and their face embeddings
    const users = await prisma.user.findMany();
    
    const userData = users.map(user => ({
      id: user.id,
      clerkId: user.clerkId,
      hasFaceEmbedding: !!user.faceEmbedding,
      faceEmbeddingLength: user.faceEmbedding ? JSON.parse(user.faceEmbedding).length : 0,
      createdAt: user.createdAt
    }));
    
    return NextResponse.json({ 
      users: userData,
      totalUsers: users.length,
      usersWithFaceEmbedding: users.filter(u => u.faceEmbedding).length
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 });
  }
} 