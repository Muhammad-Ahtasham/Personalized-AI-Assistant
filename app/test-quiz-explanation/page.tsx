"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function TestQuizExplanation() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const testExplanation = async () => {
    if (!user) {
      setResult("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/explain-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "What is the capital of France?",
          answer: "Paris",
          userAnswer: "London",
          topic: "Geography",
        }),
      });

      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Quiz Explanation</h1>
        
        <div className="mb-4">
          <p>User: {user ? user.emailAddresses[0]?.emailAddress : "Not signed in"}</p>
        </div>

        <button
          onClick={testExplanation}
          disabled={loading || !user}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Explanation API"}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <h3 className="font-bold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 