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

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      router.push("/dashboard");
    }
  }, [isSignedIn, user, router]);

  const handleFaceDetected = (embedding: number[]) => {
    setFaceEmbedding(embedding);
    setShowEmailForm(true);
    showSuccess("Face captured successfully! Please fill out the registration form.");
  };

  const handleFaceError = (error: string) => {
    console.error("FaceAuth error:", error);
    showError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!signUp) throw new Error("Sign up is not available");

      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification();

      setShowVerification(true);
      showSuccess("Verification code sent to your email!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!signUp) throw new Error("Sign up is not available");

      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });

      if (result.status === "complete") {
        if (!faceEmbedding) {
          showError("Face data missing. Please try again.");
          return;
        }

        const registerResponse = await fetch("/api/face-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
            faceEmbedding,
          }),
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(registerData.error || "Failed to complete face registration.");
        }

        showSuccess("Registration complete! Redirecting to dashboard...");
        setTimeout(() => (window.location.href = "/dashboard"), 2000);
      } else {
        showError("Verification failed. Please check the code and try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed. Try again.";
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleBackToForm = () => {
  //   setShowEmailForm(false);
  //   setFaceEmbedding(null);
  // };

  const handleBackToEmailForm = () => {
    setShowVerification(false);
    setVerificationCode("");
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent"></div>
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
          <>
            <FaceAuth
              mode="register"
              onFaceDetected={handleFaceDetected}
              onError={handleFaceError}
              isLoading={isLoading}
            />

            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Position your face in front of the camera to begin sign-up.
              </p>
            </div>
          </>
        ) : showVerification ? (
          <>
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                A verification code has been sent to <strong className="text-white">{email}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code to complete your registration.
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
              </div>

              <button type="submit" className="btn-primary w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>

              <div className="text-center">
                <button type="button" onClick={handleBackToEmailForm} className="text-sm text-yellow-accent hover:text-yellow-500 font-medium">
                  ← Back
                </button>
              </div>
            </form>
          </>
        ) : (
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
                placeholder="you@example.com"
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
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {showVerification ? (
              <>
                Didn&apos;t get the code?{" "}
                <button onClick={handleSubmit} className="text-yellow-accent hover:text-yellow-500 font-medium">
                  Resend
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <a href="/face-sign-in" className="text-yellow-accent hover:text-yellow-500 font-medium">
                  Sign in with face
                </a>
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
