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

    // Find user by email - simpler approach
    const allUsers = await prisma.user.findMany();
    console.log("All users:", allUsers.map(u => ({ id: u.id, clerkId: u.clerkId, hasFaceEmbedding: !!u.faceEmbedding })));
    
    // Try to find user by email in clerkId
    let user = allUsers.find(u => u.clerkId.includes(email));
    
    // If not found, try with email domain
    if (!user) {
      const emailDomain = email.split('@')[0];
      user = allUsers.find(u => u.clerkId.includes(emailDomain));
    }

    console.log(`Looking for user with email: ${email}, found: ${user ? 'yes' : 'no'}`);
    if (user) {
      console.log(`User has face embedding: ${user.faceEmbedding ? 'yes' : 'no'}`);
      console.log(`User clerkId: ${user.clerkId}`);
    } else {
      // Debug: show all users in database
      console.log("All users in database:", allUsers.map(u => ({ id: u.id, clerkId: u.clerkId, hasFaceEmbedding: !!u.faceEmbedding })));
    }

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
        similarity,
        userEmail: email,
        // Return a temporary token for authentication
        authToken: `face_auth_${Date.now()}_${user.clerkId}`
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