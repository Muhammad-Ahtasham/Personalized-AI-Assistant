import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current Clerk user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // For now, we'll return the base64 data URL directly
    // In a production environment, you might want to upload to a cloud storage service
    // like AWS S3, Cloudinary, or similar
    
    return NextResponse.json({
      success: true,
      imageUrl: imageData,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 