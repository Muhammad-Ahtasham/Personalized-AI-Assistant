import { NextRequest, NextResponse } from 'next/server';
import { codeStore } from '../send-code/route';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
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
    // Optionally, mark as verified (for demo, just delete the code)
    codeStore.delete(email);
    return NextResponse.json({ success: true, message: 'Code verified' });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 