# Deployment Troubleshooting Guide

## "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" Error

This error occurs when API routes return HTML (usually a 404 or error page) instead of JSON.

### Common Causes:

1. **API Route Not Found**: The API endpoint doesn't exist in production
2. **Build Issues**: API routes not properly built
3. **Environment Variables**: Missing required environment variables
4. **Netlify Configuration**: Incorrect redirects or function configuration

### Debugging Steps:

#### 1. Check API Routes in Production
```bash
# Test health endpoint
curl https://your-site.netlify.app/api/health

# Test profile API
curl https://your-site.netlify.app/api/test-profile-api
```

#### 2. Check Environment Variables
Ensure these are set in Netlify:
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

#### 3. Check Netlify Functions
Go to Netlify Dashboard → Functions to see if API routes are deployed.

#### 4. Check Build Logs
Look for any build errors in Netlify deployment logs.

### Quick Fixes:

#### 1. Force Rebuild
```bash
# Add a commit to trigger rebuild
git add .
git commit -m "Force rebuild"
git push
```

#### 2. Check API Route Structure
Ensure all API routes are in `app/api/` directory and follow Next.js 13+ App Router structure.

#### 3. Test Locally First
```bash
npm run build
npm start
# Test API routes locally before deploying
```

### Debugging Tools Added:

1. **Error Handler**: `app/api/error-handler.ts` - Consistent error responses
2. **Test API**: `app/api/test-profile-api/route.ts` - Test endpoint
3. **Better Error Handling**: Frontend now handles non-JSON responses gracefully
4. **Console Logs**: Added debugging logs to track API calls

### Testing Steps:

1. **Local Test**: Run `npm run build && npm start` and test profile updates
2. **Production Test**: Deploy and test the `/api/test-profile-api` endpoint
3. **Check Console**: Look for debug logs in browser console
4. **Check Network Tab**: Verify API calls are going to correct endpoints

### If Issue Persists:

1. Check Netlify function logs in dashboard
2. Verify all environment variables are set
3. Ensure database is accessible from Netlify functions
4. Check if Clerk is properly configured for production 