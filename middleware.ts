import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in",
  "/sign-up",
]);

export default clerkMiddleware((auth, req) => {
  // Check for face authentication session
  const faceAuthCookie = req.cookies.get('face_auth_session');
  
  if (faceAuthCookie) {
    console.log("Face auth session found in middleware:", faceAuthCookie.value);
    
    // Extract user ID from session token
    const sessionParts = faceAuthCookie.value.split('_');
    if (sessionParts.length >= 3) {
      const userId = sessionParts[2];
      console.log("Extracted user ID from face session:", userId);
      
      // For face authenticated users, allow access to protected routes
      if (!isPublicRoute(req)) {
        console.log("Face authenticated user accessing protected route");
        return NextResponse.next();
      }
    }
  }
  
  // For Clerk authenticated users, use normal Clerk middleware
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};