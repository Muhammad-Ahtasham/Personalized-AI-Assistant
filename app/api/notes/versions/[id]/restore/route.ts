import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the version to restore
    const version = await prisma.noteVersion.findUnique({
      where: { id: params.id },
      include: { note: true }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Check if the note belongs to the user
    if (version.note.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a new version of the current state before restoring
    await prisma.noteVersion.create({
      data: {
        noteId: version.noteId,
        title: version.note.title,
        content: version.note.content,
        tags: version.note.tags
      }
    });

    // Restore the note to the version state
    const restoredNote = await prisma.note.update({
      where: { id: version.noteId },
      data: {
        title: version.title,
        content: version.content,
        tags: version.tags
      }
    });

    return NextResponse.json(restoredNote);
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 