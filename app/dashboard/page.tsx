"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
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

export default function DashboardPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  
  const router = useRouter();

  useEffect(() => {
    console.log("isSignedIn", isSignedIn);
    console.log("user", user);
    console.log("isLoaded", isLoaded);
    
    // Wait for Clerk to load before making decisions
    if (!isLoaded) return;
    
    // If not signed in, redirect to sign-in
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    
    // If we don't have a user object yet, wait
    if (!user) return;
    
    const syncUserAndFetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // First, sync user to database
        const syncResponse = await fetch("/api/auth/sync-user-to-database", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!syncResponse.ok) {
          console.error("Failed to sync user to database");
        }
        
        // Then fetch user history
        const clerkId = user.id;
        
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
    
    syncUserAndFetchHistory();
  }, [user, isSignedIn, isLoaded, router]);

  // Show loading while Clerk is loading or user is not signed in
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-purple-700">
          Your Dashboard
        </h1>
        <a
          href="/"
          className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          ← Back to Home
        </a>
      </div>
      
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