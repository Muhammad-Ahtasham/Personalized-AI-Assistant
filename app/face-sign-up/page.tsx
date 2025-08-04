"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import FaceAuth from "../../components/FaceAuth";

export default function FaceSignUpPage() {
  const router = useRouter();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setIsLoading(true);

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
      
      setShowVerification(true);
      setSuccess("Verification code sent to your email!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
        setSuccess("Email verified! Please proceed to face registration.");
        setShowVerification(false);
        setShowFaceAuth(true);
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

  const handleFaceDetected = async (embedding: number[]) => {
    setFaceEmbedding(embedding);
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/face-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName: firstName || null,
          lastName: lastName || null,
          faceEmbedding: embedding,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Account created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Registration failed");
        setShowFaceAuth(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed. Please try again.");
      setShowFaceAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceError = (error: string) => {
    setError(error);
    setShowFaceAuth(false);
  };

  const handleBackToForm = () => {
    setShowFaceAuth(false);
    setFaceEmbedding(null);
  };

  const handleBackToEmailForm = () => {
    setShowVerification(false);
    setVerificationCode("");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="card-dark p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          {showFaceAuth ? "Face Registration" : showVerification ? "Verify Your Email" : "Create Account with Face Auth"}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-yellow-accent/10 border border-yellow-accent/20 text-yellow-accent rounded">
            {success}
          </div>
        )}

        {!showVerification && !showFaceAuth ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1">
                  First Name (Optional)
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
                  Last Name (Optional)
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
                minLength={8}
                className="input-dark w-full"
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending Verification..." : "Continue to Email Verification"}
            </button>
          </form>
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
            <FaceAuth
              mode="register"
              onFaceDetected={handleFaceDetected}
              onError={handleFaceError}
              isLoading={isLoading}
            />
            
            <button
              onClick={handleBackToForm}
              className="btn-secondary w-full"
            >
              ← Back to Form
            </button>
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