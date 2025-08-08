import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
// import { prisma } from "@/lib/prisma";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to save learning plans." },
      { status: 401 }
    );
  }
  const { topic, content, clerkId } = await req.json();
  if (!topic || !content || !clerkId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  try {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      // Get user details from Clerk
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(clerkId);

      if (!clerkUser) {
        return NextResponse.json(
          { error: "User not found in Clerk" },
          { status: 404 }
        );
      }

      // Get primary email
      const primaryEmail = clerkUser.emailAddresses.find(
        email => email.id === clerkUser.primaryEmailAddressId
      );

      if (!primaryEmail) {
        return NextResponse.json(
          { error: "No primary email found" },
          { status: 400 }
        );
      }

      user = await prisma.user.create({
        data: {
          clerkId,
          email: primaryEmail.emailAddress,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
        },
      });
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