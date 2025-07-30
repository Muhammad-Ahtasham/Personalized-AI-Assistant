# Face Recognition Authentication

This application now includes face recognition authentication for both sign-up and sign-in processes.

## Features

### Sign Up with Face Recognition
- Users can optionally enable face recognition during sign-up
- Face embeddings are stored securely in the database
- Multi-step registration process: form → face registration → email verification

### Sign In with Face Recognition
- Users can sign in using face recognition instead of password
- Requires email address for user identification
- Real-time face detection and matching

## Technical Implementation

### Dependencies
- `face-api.js` - Face detection and recognition
- `@tensorflow/tfjs` - TensorFlow.js for ML operations
- `@prisma/client` - Database operations

### Database Schema
```prisma
model User {
  id           String        @id @default(cuid())
  clerkId      String        @unique
  faceEmbedding String?      // Store face embedding as JSON string
  learningPlans LearningPlan[]
  quizResults   QuizResult[]
  createdAt    DateTime      @default(now())
}
```

### API Endpoints

#### POST `/api/face-register`
- Registers a user's face embedding during sign-up
- Requires authentication via Clerk
- Stores embedding as JSON string in database

#### POST `/api/face-login`
- Authenticates user using face recognition
- Compares current face embedding with stored embedding
- Uses cosine similarity for matching (threshold: 0.6)

#### GET `/api/auth/face-login`
- Handles face login redirect after successful authentication
- Redirects to dashboard with success parameter

### Components

#### `FaceRecognition.tsx`
- Main face recognition component
- Handles camera access and face detection
- Supports both registration and login modes

#### `FaceStatus.tsx`
- Status indicator for face recognition process
- Shows loading, detecting, success, and error states

### Utility Functions (`lib/face-utils.ts`)
- `cosineSimilarity()` - Calculate similarity between embeddings
- `euclideanDistance()` - Calculate distance between embeddings
- `isFaceMatch()` - Determine if faces match based on threshold
- `normalizeEmbedding()` - Normalize face embeddings

## Usage

### For Users

1. **Sign Up with Face Recognition:**
   - Fill out the registration form
   - Check "Enable face recognition for faster login"
   - Complete face registration step
   - Verify email address

2. **Sign In with Face Recognition:**
   - Click "Sign in with Face Recognition"
   - Enter your email address
   - Look at the camera for authentication

### For Developers

1. **Face Recognition Models:**
   - Models are stored in `/public/models/`
   - Downloaded from face-api.js repository
   - Includes: tiny face detector, landmark detection, and recognition models

2. **Security Considerations:**
   - Face embeddings are stored as JSON strings
   - Similarity threshold is configurable (default: 0.6)
   - Camera permissions are required

3. **Customization:**
   - Adjust similarity threshold in `app/api/face-login/route.ts`
   - Modify face detection options in `FaceRecognition.tsx`
   - Update UI styling in components

## Security Notes

- Face embeddings are mathematical representations, not actual images
- Similarity threshold prevents false positives
- Email verification is still required for account creation
- Camera permissions are handled by the browser

## Troubleshooting

1. **Camera not working:**
   - Ensure camera permissions are granted
   - Check browser compatibility
   - Try refreshing the page

2. **Face not recognized:**
   - Ensure good lighting conditions
   - Position face in the center of the camera
   - Try adjusting the similarity threshold

3. **Models not loading:**
   - Check that model files are in `/public/models/`
   - Verify network connectivity
   - Check browser console for errors

## Future Enhancements

- Multiple face embeddings per user
- Face liveness detection
- Improved error handling and user feedback
- Mobile optimization
- Biometric security enhancements 