# Clerk Webhook Setup Guide

## Issue
Users signing up with email/password or social login (Facebook/Google) are not being saved to the database because the webhook is not properly configured.

## Solution
We've implemented a dual approach:
1. **Webhook-based sync** (recommended)
2. **Fallback sync** (already implemented)

## Setup Instructions

### 1. Add Webhook Secret to Environment Variables

Add this to your `.env` file:
```env
CLERK_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Configure Clerk Webhook

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Endpoint**
4. Configure the webhook:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Events**: Select all three events:
     - `user.created`
     - `user.updated` 
     - `user.deleted`
   - **Version**: Latest
5. Click **Add Endpoint**
6. Copy the **Signing Secret** and add it to your `.env` file as `CLERK_WEBHOOK_SECRET`

### 3. Test the Webhook

1. Create a test user in Clerk
2. Check your server logs for webhook events
3. Verify the user is created in your database

## Fallback Mechanism

If the webhook fails, we've implemented a fallback sync that runs:
- When users sign in (`/app/sign-in/page.tsx`)
- When users sign up (`/app/sign-up/page.tsx`)
- When users visit the dashboard (`/app/dashboard/page.tsx`)

This ensures users are always synced to the database.

## API Routes

- `/api/webhooks/clerk` - Handles Clerk webhook events
- `/api/auth/sync-user-to-database` - Manual sync for fallback

## Troubleshooting

### Webhook Not Working
1. Check if `CLERK_WEBHOOK_SECRET` is set in `.env`
2. Verify webhook URL is accessible
3. Check server logs for webhook errors
4. Test webhook delivery in Clerk dashboard

### Users Still Not Syncing
1. Check fallback sync is working
2. Verify database connection
3. Check console logs for sync errors

## Testing

1. **Test Webhook**: Create a user in Clerk and check database
2. **Test Fallback**: Sign in with existing user and check database
3. **Test Face Auth**: Register with face and verify both Clerk and database

## Current Status

✅ **Fallback sync implemented** - Users will be synced when they sign in/sign up/visit dashboard
⚠️ **Webhook setup required** - Add `CLERK_WEBHOOK_SECRET` to `.env` and configure webhook in Clerk dashboard 