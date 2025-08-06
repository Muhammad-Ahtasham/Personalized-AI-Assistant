"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useClerk, useUser } from "@clerk/nextjs";
import FaceAuth from "../../components/FaceAuth";
import { useAlertContext } from "@/components/AlertProvider";

// Define a type for the recognized user
interface RecognizedUser {
  id: string;
  email: string;
  clerkId?: string;
  // Add other fields as needed
}

function FaceSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isLoaded } = useSignIn();
  const { setActive } = useClerk();
  const { isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useAlertContext();
  
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [recognizedUser, setRecognizedUser] = useState<RecognizedUser | null>(null);

  // Handle registration success message
  useEffect(() => {
    const message = searchParams.get('message');
    const email = searchParams.get('email');
    
    if (message === 'registration-success') {
      showSuccess("Registration successful! Please sign in with your face.");
      if (email) {
        setUserEmail(email);
      }
    }
  }, [searchParams, showSuccess]);

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
    console.log('FaceAuth: handleFaceDetected called');
    setIsLoading(true);
    
    

    try {
      console.log('FaceAuth: Making API call to face-login');
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
      console.log('FaceAuth: API response received:', faceResponse.ok, faceData);

      if (!faceResponse.ok) {
        console.log('FaceAuth: Face not recognized, setting error');
        showError(faceData.error || "Face authentication failed");
        return;
      }

      // Clear any previous error since face was recognized
      console.log('FaceAuth: Face recognized, clearing error and setting user data');
      
      setUserEmail(faceData.user.email);
      setRecognizedUser(faceData.user);

      // Check if user has a Clerk ID
      if (faceData.user.clerkId) {
        console.log('FaceAuth: User has Clerk ID, attempting traditional sign-in');
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
              showSuccess("Face authentication successful! Redirecting to dashboard...");
              // Force a page reload to ensure Clerk session is properly established
              setTimeout(() => {
                console.log("Redirecting to dashboard...");
                window.location.href = "/dashboard";
              }, 1000);
              return;
            }
          }
        } catch {
          console.log("Traditional sign-in failed, showing email input");
        }
      }

      // If user doesn't have a Clerk ID or traditional sign-in failed,
      // show email input to complete sign-in
      console.log('FaceAuth: Showing email input for manual sign-in');
      setShowEmailInput(true);
      showSuccess("Face Captured successfully! Please enter your email to complete sign-in.");

    } catch (error) {
      console.error("Face sign-in error:", error);
      showError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceError = (error: string) => {
    console.log('FaceAuth: handleFaceError called with:', error);
    showError(error);
    
  };

  const handleCompleteSignIn = async (email: string) => {
    if (!signIn) {
      showError("Sign in not available");
      return;
    }

    // SECURITY FIX: Verify that the entered email matches the face-recognized user
    if (email !== userEmail || !recognizedUser) {
      showError("Email does not match the recognized face. Please enter the correct email for the recognized user.");
      return;
    }

    try {
      console.log("Starting face user authentication for:", email);
      
      // First, set up the user's password in Clerk using the recognized user's ID
      const setupResponse = await fetch("/api/auth/setup-face-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          userId: recognizedUser.id, // Use the recognized user's ID for additional security
        }),
      });

      const setupData = await setupResponse.json();
      console.log("Setup response:", setupData);

      if (!setupResponse.ok) {
        console.error("Setup response not ok:", setupResponse.status, setupData);
        showError(setupData.error || "Failed to set up user");
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
          showSuccess("Sign-in completed! Redirecting to dashboard...");
          // Force a page reload to ensure Clerk session is properly established
          setTimeout(() => {
            console.log("Redirecting to dashboard...");
            window.location.href = "/dashboard";
          }, 1000);
        } else {
          console.error("Clerk sign-in failed:", result);
          showError(`Sign-in failed. Status: ${result.status}. Please contact support.`);
        }
      } catch (signInError) {
        console.error("Sign in error:", signInError);
        showError(`Sign-in failed: ${signInError instanceof Error ? signInError.message : 'Unknown error'}. Please contact support.`);
      }
    } catch (error) {
      console.error("Face sign-in error:", error);
      showError(`Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent"></div>
      </div>
    );
  }

  // If already signed in, show loading while redirecting
  if (isSignedIn && user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="card-dark p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Sign In with Face Recognition
        </h1>
        
        {!showEmailInput ? (
          <div className="space-y-4">
            <FaceAuth
              mode="login"
              onFaceDetected={handleFaceDetected}
              onError={handleFaceError}
              isLoading={isLoading}
            />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Position your face in the camera to sign in
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Face authentication successful! Please enter the email address for the recognized user: <strong className="text-white">{userEmail}</strong>
              </p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as HTMLFormElement).email.value;
              handleCompleteSignIn(email);
            }} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={userEmail}
                  readOnly
                  required
                  className="input-dark w-full bg-muted"
                  placeholder="Email will be auto-filled"
                />
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full"
              >
                Complete Sign In
              </button>
            </form>
            
            <button
              onClick={() => {
                setShowEmailInput(false);
                setUserEmail("");
                setRecognizedUser(null);
              }}
              className="btn-secondary w-full"
            >
              Try Face Recognition Again
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/face-sign-up" className="text-yellow-accent hover:text-yellow-500 font-medium">
              Sign up with face
            </a>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Or{" "}
            <a href="/sign-in" className="text-yellow-accent hover:text-yellow-500 font-medium">
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
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent"></div>
      </div>
    }>
      <FaceSignInContent />
    </Suspense>
  );
} 