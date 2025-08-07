import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { codeStore } from '../send-code/route';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, code, and new password are required' }, { status: 400 });
    }
    const entry = codeStore.get(email);
    if (!entry) {
      return NextResponse.json({ error: 'No code sent to this email' }, { status: 400 });
    }
    if (Date.now() > entry.expires) {
      codeStore.delete(email);
      return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
    }
    if (entry.code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }
    // Update password in Clerk
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerk = await clerkClient();
      if (user.clerkId) {
        await clerk.users.updateUser(user.clerkId, { password: newPassword });
      }
    } catch (clerkError) {
      console.error('Failed to update Clerk password:', clerkError);
      return NextResponse.json({ error: 'Failed to update password in Clerk' }, { status: 500 });
    }
    // Update password in database
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    codeStore.delete(email);
    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 