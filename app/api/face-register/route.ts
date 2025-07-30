import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { faceEmbedding, email, action } = await request.json();

    if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
      return NextResponse.json({ error: "Invalid face embedding" }, { status: 400 });
    }

    if (action === "store") {
      // Store face embedding in database with temporary flag
      if (!email) {
        return NextResponse.json({ error: "Email required for temporary storage" }, { status: 400 });
      }
      
      // Create or update user with temporary face embedding
      await prisma.user.upsert({
        where: { 
          clerkId: `temp_${email}` // Temporary ID
        },
        update: {
          faceEmbedding: JSON.stringify(faceEmbedding),
        },
        create: {
          clerkId: `temp_${email}`,
          faceEmbedding: JSON.stringify(faceEmbedding),
        },
      });
      
      console.log(`Stored face embedding for email: ${email}, embedding length: ${faceEmbedding.length}`);
      return NextResponse.json({ success: true, message: "Face embedding stored temporarily" });
    }

    if (action === "register") {
      // Register face embedding for authenticated user
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Update user with face embedding
      await prisma.user.update({
        where: { clerkId: userId },
        data: {
          faceEmbedding: JSON.stringify(faceEmbedding),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error registering face:", error);
    return NextResponse.json({ error: "Failed to register face" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email, action } = await request.json();

    if (action === "cleanup" && email) {
      // Delete temporary user
      await prisma.user.deleteMany({
        where: { 
          clerkId: `temp_${email}`
        },
      });
      
      console.log(`Cleaned up temporary user for email: ${email}`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error cleaning up:", error);
    return NextResponse.json({ error: "Failed to cleanup" }, { status: 500 });
  }
}

// Endpoint to retrieve stored face embedding
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Look for user with temporary ID
    const user = await prisma.user.findUnique({
      where: { clerkId: `temp_${email}` }
    });
    
    console.log(`Looking for face embedding for email: ${email}, found: ${user ? 'yes' : 'no'}`);
    
    if (!user || !user.faceEmbedding) {
      return NextResponse.json({ error: "No stored face embedding found" }, { status: 404 });
    }

    const embedding = JSON.parse(user.faceEmbedding);
    return NextResponse.json({ faceEmbedding: embedding });
  } catch (error) {
    console.error("Error retrieving face embedding:", error);
    return NextResponse.json({ error: "Failed to retrieve face embedding" }, { status: 500 });
  }
} 