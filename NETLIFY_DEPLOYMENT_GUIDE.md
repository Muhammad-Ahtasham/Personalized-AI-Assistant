# Netlify Deployment Guide

## ✅ **Fixed Issues**

### **1. API Routes 404 Error**
**Problem**: API routes returning 404 on Netlify
**Solution**: 
- Removed API routes from middleware matcher
- Updated `netlify.toml` configuration
- Fixed redirects for API routes

### **2. Middleware Interference**
**Problem**: Clerk middleware was running on API routes
**Solution**: Updated middleware config to exclude API routes

### **3. Build Cache Issues**
**Problem**: Stale build cache causing missing files
**Solution**: Clean build process

## 🔧 **Configuration Files**

### **netlify.toml**
```toml
[build]
  command = "npm install && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@prisma/client"]

[context.production.environment]
  NODE_ENV = "production"

# Handle API routes
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/___netlify-handler"
  status = 200
  force = true

# Handle Next.js static assets
[[redirects]]
  from = "/_next/static/*"
  to = "/_next/static/:splat"
  status = 200

# Handle Next.js image optimization
[[redirects]]
  from = "/_next/image"
  query = { q = ":quality", url = ":url", w = ":width" }
  to = "/.netlify/images?url=:url&w=:width&q=:quality"
  status = 200

# Handle IPX image optimization
[[redirects]]
  from = "/_ipx/*"
  query = { q = ":quality", url = ":url", w = ":width" }
  to = "/.netlify/images?url=:url&w=:width&q=:quality"
  status = 200

# Handle all other routes (SPA fallback)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Cache static assets
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache API responses
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
```

### **middleware.ts**
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in",
  "/sign-up",
  "/face-sign-in",
  "/face-sign-up",
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard",
  "/notes",
  "/profile"
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle protected routes
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }
  
  // For all other routes, use normal Clerk middleware
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/"],
};
```

## 🚀 **Deployment Steps**

### **1. Pre-deployment Checklist**
- [ ] All API routes are working locally
- [ ] Build completes successfully (`npm run build`)
- [ ] Environment variables are set in Netlify
- [ ] Database is accessible from Netlify

### **2. Environment Variables**
Make sure these are set in Netlify:
```
DATABASE_URL=your_database_url
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
OPENROUTER_API_KEY=your_openrouter_key
```

### **3. Build Command**
```bash
npm install && npm run build
```

### **4. Publish Directory**
```
.next
```

## 🧪 **Testing API Routes**

### **Test Endpoints**
- `/api/health` - Basic health check
- `/api/test-deploy` - Deployment test
- `/api/test-simple` - Simple API test

### **Expected Responses**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-05T10:50:00.000Z",
  "environment": "production",
  "openRouterKey": "Set"
}
```

## 🔍 **Troubleshooting**

### **API Routes Returning 404**
1. Check `netlify.toml` configuration
2. Verify middleware isn't intercepting API routes
3. Check build logs for errors
4. Test with `/api/test-deploy`

### **Build Failures**
1. Clean build: `rm -rf .next && npm run build`
2. Check for missing dependencies
3. Verify TypeScript compilation
4. Check for missing API route files

### **Environment Issues**
1. Verify all environment variables are set
2. Check database connectivity
3. Verify Clerk configuration
4. Test API routes locally first

## 📝 **Common Issues & Solutions**

### **Issue: API routes work locally but not on Netlify**
**Solution**: 
- Check `netlify.toml` redirects
- Verify middleware configuration
- Test with simple API route first

### **Issue: Build succeeds but deployment fails**
**Solution**:
- Check environment variables
- Verify database connectivity
- Check function timeout settings

### **Issue: Static assets not loading**
**Solution**:
- Check `_next/static` redirects
- Verify cache headers
- Check build output

## 🎯 **Best Practices**

1. **Always test locally first**
2. **Use simple API routes for testing**
3. **Check build logs carefully**
4. **Verify environment variables**
5. **Test each API route individually**
6. **Monitor deployment logs**

## 📊 **Monitoring**

### **Health Check Endpoints**
- `/api/health` - Basic system health
- `/api/test-deploy` - Deployment verification
- `/api/test-simple` - Simple functionality test

### **Expected Build Output**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Collecting build traces
✓ Finalizing page optimization
```

This guide should resolve the API route issues on Netlify deployment! 🚀 