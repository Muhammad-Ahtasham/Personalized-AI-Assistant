"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
// import { redirect } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation";

interface LearningPlan {
  id: string;
  topic: string;
  content: string;
  createdAt: string;
}

interface QuizResult {
  id: string;
  topic: string;
  questions: QuizQuestion[];
  answers: string[];
  score: number;
  createdAt: string;
}

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
}
// Chaning
export default function DashboardPage() {
  const { isSignedIn, user } = useUser();
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [faceAuthSession, setFaceAuthSession] = useState<string | null>(null);

  useEffect(() => {
    console.log("isSignedIn", isSignedIn);
    console.log("user", user);
    
    // Check for face authentication session
    const checkFaceAuth = () => {
      console.log("Checking for face auth session...");
      console.log("All cookies:", document.cookie);
      const cookies = document.cookie.split(';');
      const faceAuthCookie = cookies.find(cookie => cookie.trim().startsWith('face_auth_session='));
      console.log("Face auth cookie found:", faceAuthCookie);
      if (faceAuthCookie) {
        const sessionToken = faceAuthCookie.split('=')[1];
        console.log("Session token:", sessionToken);
        setFaceAuthSession(sessionToken);
        return true;
      }
      return false;
    };
    
    // Check for face authentication session
    const hasFaceAuth = checkFaceAuth();
    
    // If not signed in with Clerk and no face auth session, redirect to sign-in
    if (!isSignedIn && !hasFaceAuth) {
      router.push("/sign-in");
      return;
    }
    
    // If we have either Clerk user or face auth session, proceed
    if (!user && !faceAuthSession) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // If using face auth, we might not have a user object
        let clerkId = user?.id;
        if (!clerkId && faceAuthSession) {
          // Extract userId from session token: face_auth_TIMESTAMP_USERID
          const sessionParts = faceAuthSession.split('_');
          if (sessionParts.length >= 3) {
            clerkId = sessionParts[2];
          }
        }
        
        if (!clerkId) {
          console.log("No clerkId found for user history");
          return;
        }
        
        const res = await fetch("/api/user-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch history");
        setPlans(data.plans || []);
        setQuizzes(data.quizzes || []);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };
    
    // Check for stored face embedding and register it
    const registerStoredFace = async () => {
      try {
        const userEmail = user?.emailAddresses[0]?.emailAddress;
        if (!userEmail) return;
        
        const response = await fetch(`/api/face-register?email=${userEmail}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Found stored face embedding, registering...");
          
          // Register the stored face embedding
          const registerResponse = await fetch("/api/face-register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              faceEmbedding: data.faceEmbedding,
              action: "register"
            }),
          });
          
          if (registerResponse.ok) {
            console.log("Face embedding registered successfully");
            // Clean up the temporary user
            try {
              await fetch("/api/face-register", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                  email: userEmail,
                  action: "cleanup"
                }),
              });
            } catch (cleanupError) {
              console.log("Cleanup failed but face registration succeeded");
            }
          }
        }
      } catch (error) {
        console.log("No stored face embedding found or registration failed", error);
      }
    };
    
    fetchHistory();
    registerStoredFace();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-8 text-purple-700 text-center">
        Your Dashboard
      </h1>
      
      {/* {faceAuthSession && (
        <div className="mb-4 text-center">
          <button
            onClick={() => {
              document.cookie = 'face_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              router.push('/sign-in');
            }}
            className="text-sm text-red-600 hover:text-red-700 underline"
          >
            Logout (Face Auth)
          </button>
        </div>
      )} */}
      {loading && <div className="mb-4">Loading...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-purple-600">Learning Plans</h2>
        {plans.length === 0 ? (
          <div className="text-gray-500">No learning plans yet.</div>
        ) : (
          <ul className="space-y-4">
            {plans.map(plan => (
              <li key={plan.id} className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded">
                <div className="font-bold text-purple-800">{plan.topic}</div>
                <div className="text-gray-700 whitespace-pre-line mt-1">{plan.content}</div>
                <div className="text-xs text-gray-400 mt-2">{new Date(plan.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3 text-purple-600">Quiz Results</h2>
        {quizzes.length === 0 ? (
          <div className="text-gray-500">No quiz results yet.</div>
        ) : (
          <ul className="space-y-4">
            {quizzes.map(quiz => (
              <li key={quiz.id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="font-bold text-yellow-800">{quiz.topic}</div>
                <div className="text-gray-700 mt-1">Score: {quiz.score}</div>
                <div className="text-xs text-gray-400 mt-2">{new Date(quiz.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 