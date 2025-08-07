"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useUser } from "@clerk/nextjs";
import FaceAuth from "../../components/FaceAuth";
import { useAlertContext } from "@/components/AlertProvider";


function FaceSignUpContent() {
  const router = useRouter();
  const { signUp, isLoaded } = useSignUp();
  const { isSignedIn, user } = useUser();
  const { showSuccess, showError } = useAlertContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [tempFaceId, setTempFaceId] = useState<string | null>(null);

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      router.push("/dashboard");
    }
  }, [isSignedIn, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!signUp) {
        throw new Error("Sign up not available");
      }

      // Only create the Clerk user (don't create database user yet)
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification();
      
      setShowVerification(true);
      showSuccess("Verification code sent to your email!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!signUp) {
        throw new Error("Sign up not available");
      }

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        // Now create the user in our database with face embedding
        if (faceEmbedding) {
          const registerResponse = await fetch("/api/face-register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              firstName,
              lastName,
              faceEmbedding,
            }),
          });

          if (!registerResponse.ok) {
            const errorData = await registerResponse.json();
            showError(errorData.error || "Failed to register user with face authentication");
            return;
          }
        }
        
        showSuccess("Registration completed! Redirecting to dashboard...");
        
        // Redirect to dashboard after successful verification
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        showError("Verification failed. Please check your code and try again.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed. Please try again.";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceDetected = async (embedding: number[]) => {
    console.log('FaceAuth: handleFaceDetected called');
    console.log(tempFaceId? "TempFaceId Loaded": "TempFaceId Not Loaded")
    setIsLoading(true);
    
    try {
      console.log('FaceAuth: Making API call to face-register for temporary storage');
      const response = await fetch("/api/face-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          faceEmbedding: embedding,
        }),
      });

      const data = await response.json();
      console.log('FaceAuth: API response received:', response.ok, data);

      if (!response.ok) {
        showError("Face capture failed");
        return;
      }

      setFaceEmbedding(embedding);
      setTempFaceId(data.tempId);
      setShowEmailForm(true);
      showSuccess("Face captured successfully! Please enter your details to complete registration.");
    } catch (error) {
      console.error('FaceAuth: Error during face capture:', error);
      showError("Face capture failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceError = (error: string) => {
    console.error('FaceAuth: Error:', error);
    showError(error);
  };

  const handleBackToForm = () => {
    setShowEmailForm(false);
    setFaceEmbedding(null);
    setTempFaceId(null);
  };

  const handleBackToEmailForm = () => {
    setShowVerification(false);
    setVerificationCode("");
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="card-dark p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Sign Up with Face Recognition
        </h1>

        {!showEmailForm ? (
          <div className="space-y-4">
            <FaceAuth
              mode="register"
              onFaceDetected={handleFaceDetected}
              onError={handleFaceError}
              isLoading={isLoading}
            />
            
            <button
              onClick={handleBackToForm}
              className="btn-primary w-full"
            >
              ← Back to Form
            </button>
          </div>
        ) : showVerification ? (
          <>
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;ve sent a verification code to <strong className="text-white">{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Please check your email and enter the 6-digit verification code below.
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-white mb-1">
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="input-dark w-full text-center text-lg tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToEmailForm}
                  className="text-sm text-yellow-accent hover:text-yellow-500 font-medium"
                >
                  ← Back to sign up
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Face captured successfully! Please enter your details to complete registration.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-dark w-full"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-dark w-full"
                  placeholder="Create a strong password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-dark w-full"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-dark w-full"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending Verification..." : "Continue to Email Verification"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {!showVerification ? (
              <>
                Already have an account?{" "}
                <a href="/face-sign-in" className="text-yellow-accent hover:text-yellow-500 font-medium">
                  Sign in with face
                </a>
              </>
            ) : (
              <>
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={handleSubmit}
                  className="text-yellow-accent hover:text-yellow-500 font-medium"
                >
                  Resend code
                </button>
              </>
            )}
          </p>
          {!showVerification && (
            <p className="text-sm text-muted-foreground mt-2">
              Or{" "}
              <a href="/sign-up" className="text-yellow-accent hover:text-yellow-500 font-medium">
                sign up with email
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FaceSignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent"></div>
      </div>
    }>
      <FaceSignUpContent />
    </Suspense>
  );
}