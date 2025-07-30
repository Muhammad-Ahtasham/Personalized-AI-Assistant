"use client";
import { useSignUp, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FaceRecognition from "../../components/FaceRecognition";

export default function SignUpPage() {
  const { signUp, isLoaded } = useSignUp();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [registrationStep, setRegistrationStep] = useState<"form" | "face" | "verification">("form");

  console.log("User from Sign-up Page --> ", isSignedIn);
  
  if (isSignedIn) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!signUp) {
        throw new Error("Sign up not available");
      }

      // Create the signup with just email and password
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification();
      
      if (showFaceRegistration) {
        setRegistrationStep("face");
      } else {
        setShowVerification(true);
        setSuccess("Verification code sent to your email!");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceDetected = async (embedding: number[]) => {
    setFaceEmbedding(embedding);
    
    try {
      // Store face embedding temporarily
      const response = await fetch("/api/face-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          faceEmbedding: embedding,
          email: email,
          action: "store"
        }),
      });

      if (response.ok) {
        setSuccess("Face captured successfully! Please verify your email.");
        setRegistrationStep("verification");
        setShowVerification(true);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to capture face");
      }
    } catch (error) {
      setError("Failed to capture face. Please try again.");
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!signUp) {
        throw new Error("Sign up not available");
      }

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        // If face registration was enabled, register the face now
        if (showFaceRegistration && faceEmbedding) {
          try {
            const response = await fetch("/api/face-register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                faceEmbedding: faceEmbedding,
                action: "register"
              }),
            });

            if (!response.ok) {
              console.warn("Face registration failed, but account was created successfully");
            }
          } catch (error) {
            console.warn("Face registration failed, but account was created successfully", error);
          }
        }

        setSuccess("Account created successfully! Redirecting to dashboard...");
        // Redirect to dashboard after successful verification
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        setError("Verification failed. Please check your code and try again.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      if (!signUp) {
        throw new Error("Sign up not available");
      }
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Google sign up failed. Please try again.";
      setError(errorMessage);
    }
  };

  const handleFacebookSignUp = async () => {
    try {
      if (!signUp) {
        throw new Error("Sign up not available");
      }
      await signUp.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Facebook sign up failed. Please try again.";
      setError(errorMessage);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {registrationStep === "verification" ? "Verify Your Email" : 
           registrationStep === "face" ? "Register Your Face" : "Create Your Account"}
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

        {registrationStep === "form" && (
          <>
            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 550 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
              <button
                onClick={handleFacebookSignUp}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 550 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name (Optional)
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name (Optional)
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Face Recognition Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  id="faceRegistration"
                  type="checkbox"
                  checked={showFaceRegistration}
                  onChange={(e) => setShowFaceRegistration(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="faceRegistration" className="text-sm text-gray-700">
                  Enable face recognition for faster login
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </>
        )}

        {registrationStep === "face" && (
          <div className="space-y-4">
            <FaceRecognition
              onFaceDetected={handleFaceDetected}
              onError={setError}
              mode="register"
              isActive={true}
            />
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setRegistrationStep("form")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to sign up
              </button>
            </div>
          </div>
        )}

        {registrationStep === "verification" && (
          <>
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ve sent a verification code to <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Please check your email and enter the 6-digit verification code below.
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setRegistrationStep("form")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to sign up
                </button>
              </div>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {registrationStep === "form" ? (
              <>
                Already have an account?{" "}
                <a href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </a>
              </>
            ) : registrationStep === "verification" ? (
              <>
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={handleSubmit}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Resend code
                </button>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
} 
