import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleApiError, createErrorResponse } from '../../error-handler';

export async function POST(request: NextRequest) {
  try {
    // Get the current Clerk user
    const { userId } = await auth();
    
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { imageData } = requestBody;

    if (!imageData) {
      return createErrorResponse('No image data provided', 400);
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
    return handleApiError(error, 'Upload profile image');
  }
} 