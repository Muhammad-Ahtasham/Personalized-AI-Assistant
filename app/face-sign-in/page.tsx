"use client";

import { useState, Suspense } from "react";
// import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import FaceAuth from "../../components/FaceAuth";
import { useAlertContext } from "@/components/AlertProvider";

function FaceSignInContent() {
  // const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const { setActive } = useClerk();
  const { showSuccess, showError } = useAlertContext();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [faceEmbeddingFromDB, setFaceEmbeddingFromDB] = useState<number[] | null>(null);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Fetch the stored face embedding after email is submitted
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/face/get-embedding-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "User not found.");
      }

      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error("No embedding found for this user.");
      }

      // setFaceEmbeddingFromDB(data.embedding);
      setFaceEmbeddingFromDB(data.embedding?.[0]?.embedding);
      setEmailSubmitted(true);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Compare embeddings on face detection
  const handleFaceDetected = async (liveEmbedding: number[]) => {
    if (!faceEmbeddingFromDB) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/face/compare-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          liveEmbedding,
          storedEmbedding: faceEmbeddingFromDB,
        }),
      });


      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Face verification failed.");
      }

      // Sign in with stored password (fetched from backend)
      const passwordResult = await fetch("/api/auth/get-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const passwordData = await passwordResult.json();

      if (!passwordResult.ok || !passwordData.user?.password) {
        throw new Error("Password not found for user.");
      }

      const result = await signIn?.create({
        identifier: email,
        password: passwordData.user.password,
      });

      if (result?.status === "complete") {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        showSuccess("Face authentication successful! Redirecting...");
        setTimeout(() => (window.location.href = "/dashboard"), 1000);
      } else {
        throw new Error("Sign-in failed.");
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Authentication error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceError = (error: string) => {
    showError(error);
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="card-dark p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Face Sign In
        </h1>

        {!emailSubmitted ? (
          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-dark w-full bg-muted"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : "Continue"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Hello, <strong className="text-white">{email}</strong>.<br />
              Position your face in front of the camera for verification.
            </p>
            <FaceAuth
              mode="login"
              onFaceDetected={handleFaceDetected}
              onError={handleFaceError}
              isLoading={isLoading}
            />
            <button
              onClick={() => {
                setEmail("");
                setEmailSubmitted(false);
                setFaceEmbeddingFromDB(null);
              }}
              className="btn-secondary w-full mt-4"
            >
              Back
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
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-black">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent"></div>
        </div>
      }
    >
      <FaceSignInContent />
    </Suspense>
  );
}
