"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useClerk, useUser } from "@clerk/nextjs";
import FaceAuth from "../../components/FaceAuth";

function FaceSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isLoaded } = useSignIn();
  const { setActive } = useClerk();
  const { isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Handle registration success message
  useEffect(() => {
    const message = searchParams.get('message');
    const email = searchParams.get('email');
    
    if (message === 'registration-success') {
      setSuccess("Registration successful! Please sign in with your face.");
      if (email) {
        setUserEmail(email);
      }
    }
  }, [searchParams]);

  // Redirect to dashboard if already signed in
  useEffect(() => {
    console.log("Face sign-in page - isSignedIn:", isSignedIn);
    console.log("Face sign-in page - user:", user);
    console.log("Face sign-in page - isLoaded:", isLoaded);
    
    if (isSignedIn && user) {
      console.log("User is signed in, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [isSignedIn, user, isLoaded, router]);

  const handleFaceDetected = async (embedding: number[]) => {
    setIsLoading(true);
    setError("");

    try {
      // First, authenticate face with our API
      const faceResponse = await fetch("/api/face-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          faceEmbedding: embedding,
        }),
      });

      const faceData = await faceResponse.json();

      if (!faceResponse.ok) {
        setError(faceData.error || "Face authentication failed");
        return;
      }

      setUserEmail(faceData.user.email);

      // Check if user has a Clerk ID
      if (faceData.user.clerkId) {
        // User exists in Clerk, try to sign in
        try {
          const passwordResponse = await fetch("/api/auth/get-user-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: faceData.user.email,
            }),
          });

          const passwordData = await passwordResponse.json();

          if (passwordResponse.ok && passwordData.user.password && signIn) {
            // Try traditional sign-in
            const result = await signIn.create({
              identifier: faceData.user.email,
              password: passwordData.user.password,
            });

            if (result.status === "complete") {
              // Explicitly set the active session
              if (result.createdSessionId) {
                console.log("Setting active session with ID:", result.createdSessionId);
                await setActive({ session: result.createdSessionId });
              }
              
              console.log("Face authentication successful, waiting before redirect...");
              setSuccess("Face authentication successful! Redirecting to dashboard...");
              // Force a page reload to ensure Clerk session is properly established
              setTimeout(() => {
                console.log("Redirecting to dashboard...");
                window.location.href = "/dashboard";
              }, 1000);
              return;
            }
          }
        } catch (signInError) {
          console.log("Traditional sign-in failed, showing email input");
        }
      }

      // If user doesn't have a Clerk ID or traditional sign-in failed,
      // show email input to complete sign-in
      setShowEmailInput(true);
      setSuccess("Face authentication successful! Please enter your email to complete sign-in.");

    } catch (error) {
      console.error("Face sign-in error:", error);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceError = (error: string) => {
    setError(error);
  };

  const handleCompleteSignIn = async (email: string) => {
    if (!signIn) {
      setError("Sign in not available");
      return;
    }

    try {
      console.log("Starting face user authentication for:", email);
      
      // First, set up the user's password in Clerk
      const setupResponse = await fetch("/api/auth/setup-face-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const setupData = await setupResponse.json();
      console.log("Setup response:", setupData);

      if (!setupResponse.ok) {
        console.error("Setup response not ok:", setupResponse.status, setupData);
        setError(setupData.error || "Failed to set up user");
        return;
      }

      // Now try to sign in with the set password
      try {
        console.log("Attempting sign in with set password...");
        const result = await signIn.create({
          identifier: email,
          password: setupData.password,
        });

        console.log("Clerk sign-in result:", result);

        if (result.status === "complete") {
          // Explicitly set the active session
          if (result.createdSessionId) {
            console.log("Setting active session with ID:", result.createdSessionId);
            await setActive({ session: result.createdSessionId });
          }
          
          console.log("Sign-in completed successfully, waiting before redirect...");
          setSuccess("Sign-in completed! Redirecting to dashboard...");
          // Force a page reload to ensure Clerk session is properly established
          setTimeout(() => {
            console.log("Redirecting to dashboard...");
            window.location.href = "/dashboard";
          }, 1000);
        } else {
          console.error("Clerk sign-in failed:", result);
          setError(`Sign-in failed. Status: ${result.status}. Please contact support.`);
        }
      } catch (signInError) {
        console.error("Sign in error:", signInError);
        setError(`Sign-in failed: ${signInError instanceof Error ? signInError.message : 'Unknown error'}. Please contact support.`);
      }
    } catch (error) {
      console.error("Face sign-in error:", error);
      setError(`Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If already signed in, show loading while redirecting
  if (isSignedIn && user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Sign In with Face Recognition
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {!showEmailInput ? (
          <div className="space-y-4">
            <FaceAuth
              mode="login"
              onFaceDetected={handleFaceDetected}
              onError={handleFaceError}
              isLoading={isLoading}
            />
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Position your face in the camera to sign in
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Face authentication successful! Please enter your email to complete the sign-in process.
              </p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as HTMLFormElement).email.value;
              handleCompleteSignIn(email);
            }} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={userEmail}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Complete Sign In
              </button>
            </form>
            
            <button
              onClick={() => {
                setShowEmailInput(false);
                setSuccess("");
                setUserEmail("");
              }}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Try Face Recognition Again
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="/face-sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up with face
            </a>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Or{" "}
            <a href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
              sign in with email
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FaceSignInPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <FaceSignInContent />
    </Suspense>
  );
} 