import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleApiError, createErrorResponse } from '../../error-handler';
import cloudinary from '@/app/lib/cloudinary';

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

    const uploadResult = await cloudinary.uploader.upload(imageData, {
      folder: `users/${userId}`,
      overwrite: true,
      resource_type: 'image'
    });


    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    return handleApiError(error, 'Upload profile image');
  }
} 