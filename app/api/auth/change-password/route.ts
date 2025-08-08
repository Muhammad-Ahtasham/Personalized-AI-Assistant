import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { currentPassword, newPassword } = requestBody;
    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user has a password, verify current password
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      // const isMatch = await bcrypt.compare(currentPassword, user.password);
      const isMatch = currentPassword === user.password;
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
      }
    }
    // If user.password is null, allow setting a new password (first time set)

    // Hash new password
    // const hashedPassword = await bcrypt.hash(newPassword, 12);
    const hashedPassword = newPassword;

    // Update password in Clerk
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerk = await clerkClient();
      await clerk.users.updateUser(userId, { password: newPassword });
    } catch (clerkError) {
      console.error('Failed to update Clerk password:', clerkError);
      return NextResponse.json({ error: 'Failed to update password in Clerk' }, { status: 500 });
    }

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: user.password ? 'Password changed successfully' : 'Password set successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 