"use client";

import { useEffect, useState, Suspense } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

function FaceCompleteContent() {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Processing...");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!token || !userId || !email) {
      setError("Invalid authentication parameters");
      return;
    }

    // Check if we're already signed in
    if (isSignedIn) {
      router.push("/dashboard");
      return;
    }

    const completeFaceAuth = async () => {
      try {
        setStatus("Completing authentication...");
        
        // Since we can't programmatically sign in with Clerk,
        // we'll create a session that works with our custom auth system
        const response = await fetch("/api/auth/create-face-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            token,
            userId,
            email
          }),
        });

        if (response.ok) {
          setStatus("Authentication successful! Redirecting...");
          // Redirect to dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        } else {
          const data = await response.json();
          setError(data.error || "Authentication failed");
        }
      } catch (error) {
        console.error("Error completing face auth:", error);
        setError("Authentication failed");
      }
    };

    if (isLoaded) {
      completeFaceAuth();
    }
  }, [isLoaded, isSignedIn, searchParams, router]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md text-center border border-border">
          <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md text-center border border-border">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Completing Authentication</h1>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}

export default function FaceCompletePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md text-center border border-border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Loading...</h1>
          <p className="text-muted-foreground">Preparing authentication...</p>
        </div>
      </div>
    }>
      <FaceCompleteContent />
    </Suspense>
  );
} 