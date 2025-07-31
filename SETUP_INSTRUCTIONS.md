# Authentication Setup Instructions

## Issues Fixed

1. **Users not being stored in database**: Added Clerk webhook to sync users
2. **Face signup not redirecting to dashboard**: Updated face registration flow
3. **Face signin asking for password**: Modified to only ask for email

## Setup Steps

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Database
DATABASE_URL=your_database_url
```

### 2. Clerk Webhook Setup

1. Go to your Clerk Dashboard
2. Navigate to Webhooks
3. Create a new webhook with the following settings:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Events**: Select `user.created`, `user.updated`, `user.deleted`
   - **Version**: Latest
4. Copy the webhook secret and add it to your environment variables

### 3. Database Migration

Run the database migrations:

```bash
npx prisma migrate dev
```

### 4. Install Dependencies

```bash
npm install svix
```

## Authentication Flow

### Regular Sign Up/Sign In
1. User signs up with email/password through Clerk
2. Clerk webhook creates/updates user in database
3. User is redirected to dashboard

### Face Authentication
1. **Face Sign Up**:
   - User enters email/password and face data
   - User is created in database with face embeddings
   - User is redirected to face sign-in to complete setup

2. **Face Sign In**:
   - User's face is scanned and matched
   - If user has Clerk ID, they are signed in directly
   - If user doesn't have Clerk ID, one is created and user is signed in
   - User is redirected to dashboard

## API Routes

- `/api/webhooks/clerk` - Handles Clerk webhook events
- `/api/face-register` - Registers user with face data
- `/api/face-login` - Authenticates user with face
- `/api/auth/get-user-password` - Gets user password for Clerk auth
- `/api/auth/create-clerk-user` - Creates Clerk user for face-registered users

## Testing

1. Test regular sign up/sign in
2. Test face registration
3. Test face authentication
4. Verify users are created in database
5. Verify sessions are created properly

## Troubleshooting

- Check webhook logs in Clerk dashboard
- Verify environment variables are set correctly
- Check database connection
- Ensure face recognition models are loaded properly 