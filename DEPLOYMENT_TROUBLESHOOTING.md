# Deployment Troubleshooting Guide

## "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" Error

This error occurs when API routes return HTML (usually a 404 or error page) instead of JSON.

### Common Causes:

1. **API Route Not Found**: The API endpoint doesn't exist in production
2. **Build Issues**: API routes not properly built
3. **Environment Variables**: Missing required environment variables
4. **Netlify Configuration**: Incorrect redirects or function configuration
5. **Function Timeout**: Serverless functions timing out
6. **Memory Issues**: Functions running out of memory

### Debugging Steps:

#### 1. Check API Routes in Production
```bash
# Test health endpoint
curl https://your-site.netlify.app/api/health

# Test basic deploy endpoint
curl https://your-site.netlify.app/api/test-deploy

# Test quiz endpoint (no auth required)
curl -X POST https://your-site.netlify.app/api/test-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic":"test"}'
```

#### 2. Check Environment Variables
Ensure these are set in Netlify:
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `OPENROUTER_API_KEY` (for quiz/plan generation)

#### 3. Check Netlify Functions
Go to Netlify Dashboard → Functions to see if API routes are deployed.

#### 4. Check Build Logs
Look for any build errors in Netlify deployment logs.

#### 5. Check Function Logs
In Netlify Dashboard → Functions → View function logs for specific errors.

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

#### 4. Increase Function Timeout
Add to `netlify.toml`:
```toml
[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@prisma/client"]
  timeout = 30
```

#### 5. Check Memory Limits
If functions are running out of memory, consider:
- Reducing bundle size
- Using external modules
- Optimizing imports

### Debugging Tools Added:

1. **Error Handler**: `app/api/error-handler.ts` - Consistent error responses
2. **Test API**: `app/api/test-profile-api/route.ts` - Test endpoint
3. **Test Deploy**: `app/api/test-deploy/route.ts` - Basic API test
4. **Test Quiz**: `app/api/test-quiz/route.ts` - Quiz generation test (no auth)
5. **Better Error Handling**: Frontend now handles non-JSON responses gracefully
6. **Console Logs**: Added debugging logs to track API calls

### Testing Steps:

1. **Local Test**: Run `npm run build && npm start` and test profile updates
2. **Production Test**: Deploy and test the `/api/test-deploy` endpoint
3. **Quiz Test**: Test `/api/test-quiz` endpoint (no authentication required)
4. **Check Console**: Look for debug logs in browser console
5. **Check Network Tab**: Verify API calls are going to correct endpoints

### Specific 502 Bad Gateway Debugging:

1. **Test Basic Endpoints**: Start with `/api/health` and `/api/test-deploy`
2. **Test Without Auth**: Use `/api/test-quiz` to isolate authentication issues
3. **Check Environment Variables**: Verify `OPENROUTER_API_KEY` is set
4. **Check Function Logs**: Look for timeout or memory errors
5. **Test OpenRouter API**: Verify the API key works with direct calls

### If Issue Persists:

1. Check Netlify function logs in dashboard
2. Verify all environment variables are set
3. Ensure database is accessible from Netlify functions
4. Check if Clerk is properly configured for production
5. Consider increasing function timeout or memory limits
6. Test with simpler endpoints to isolate the issue 