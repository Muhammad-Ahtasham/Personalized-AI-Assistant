# Face Authentication Implementation

This document describes the face authentication system implemented in the Personalized Study Assistant application.

## Overview

The face authentication system allows users to register and sign in using face recognition instead of traditional email/password authentication. The system uses face-api.js for face detection and embedding generation, stores face embeddings in the database, and integrates with Clerk for session management.

## Architecture

### Components

1. **FaceAuth Component** (`components/FaceAuth.tsx`)
   - Handles camera access and face detection
   - Uses face-api.js for face recognition
   - Provides real-time face embedding capture

2. **API Endpoints**
   - `/api/face-register` - User registration with face embedding
   - `/api/face-login` - Face authentication and user lookup
   - `/api/auth/get-user-password` - Retrieve user credentials for Clerk

3. **Pages**
   - `/face-sign-up` - Face registration page
   - `/face-sign-in` - Face login page

### Database Schema

The system extends the existing User model with face authentication capabilities:

```prisma
model User {
  id           String        @id @default(cuid())
  clerkId      String?       @unique
  email        String        @unique
  password     String?
  firstName    String?
  lastName     String?
  faceEmbeddings FaceEmbedding[]
  // ... other fields
}

model FaceEmbedding {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  embedding Json     // Store face embedding as JSON
  createdAt DateTime @default(now())
}
```

## How It Works

### Registration Process

1. User fills out registration form (email, password, name)
2. User's face is captured using the camera
3. Face embedding is generated using face-api.js
4. User data and face embedding are stored in the database
5. User is redirected to dashboard

### Login Process

1. User's face is captured using the camera
2. Face embedding is generated and compared with stored embeddings
3. If match is found, user credentials are retrieved from database
4. User is authenticated with Clerk using retrieved credentials
5. User is redirected to dashboard

### Face Recognition

The system uses cosine similarity to compare face embeddings:

```typescript
function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  // Calculate dot product and norms
  // Return similarity score between 0 and 1
}
```

A similarity threshold of 0.6 is used to determine if faces match.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install bcryptjs @types/bcryptjs face-api.js
```

### 2. Download Face API Models

The face-api.js models are automatically downloaded to `/public/models/` when the application starts.

### 3. Run Database Migration

```bash
npx prisma migrate dev --name add_face_authentication
```

### 4. Environment Variables

Ensure your `.env` file includes:

```
DATABASE_URL=your_database_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

## Usage

### For Users

1. **Registration**: Visit `/face-sign-up` to create an account with face authentication
2. **Login**: Visit `/face-sign-in` to sign in using face recognition
3. **Traditional Auth**: Still available via `/sign-in` and `/sign-up`

### For Developers

The face authentication system is modular and can be easily extended:

- Adjust similarity threshold in `/api/face-login/route.ts`
- Modify face detection parameters in `components/FaceAuth.tsx`
- Add additional face embeddings per user for better accuracy

## Security Considerations

1. **Face Embeddings**: Stored as JSON in the database, not as raw images
2. **Password Storage**: Passwords are hashed using bcrypt
3. **Session Management**: Uses Clerk for secure session handling
4. **Camera Access**: Requires user permission for camera access

## Troubleshooting

### Common Issues

1. **Camera not working**: Ensure HTTPS is enabled (required for camera access)
2. **Face not detected**: Check lighting conditions and face positioning
3. **Models not loading**: Verify `/public/models/` directory exists with model files
4. **Database errors**: Run `npx prisma generate` and check database connection

### Performance Tips

1. **Model Loading**: Face API models are loaded once and cached
2. **Detection Frequency**: Face detection runs every 100ms for real-time response
3. **Embedding Storage**: Face embeddings are stored as JSON for efficient comparison

## API Reference

### POST /api/face-register

Register a new user with face authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "faceEmbedding": [0.1, 0.2, ...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully with face authentication",
  "userId": "user_id"
}
```

### POST /api/face-login

Authenticate user using face recognition.

**Request Body:**
```json
{
  "faceEmbedding": [0.1, 0.2, ...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face authentication successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "similarity": 0.85
}
```

### POST /api/auth/get-user-password

Retrieve user password for Clerk authentication.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "password": "hashed_password",
    "firstName": "John",
    "lastName": "Doe"
  }
}
``` 