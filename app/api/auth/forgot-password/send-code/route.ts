import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const codeStore = new Map<string, { code: string; expires: number }>();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }
    // Generate code and store it (expires in 10 min)
    const code = generateCode();
    codeStore.set(email, { code, expires: Date.now() + 10 * 60 * 1000 });
    // TODO: Send code via email (for demo, just log it)
    console.log(`Password reset code for ${email}: ${code}`);
    // In production, use Clerk or an email service to send the code
    return NextResponse.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// For demo: export the codeStore for use in other routes
export { codeStore };
