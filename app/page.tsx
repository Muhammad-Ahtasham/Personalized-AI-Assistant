"use client";
import React, { useState } from "react";

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPlan(null);
    setError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">Personalized Study Assistant</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label htmlFor="topic" className="font-medium text-gray-700">What do you want to learn?</label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="e.g. Linear Algebra, React, World War II..."
          required
        />
        <button
          type="submit"
          className="bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Learning Plan"}
        </button>
      </form>
      {error && (
        <div className="mt-6 p-3 bg-red-100 border-l-4 border-red-400 text-red-800 rounded">
          {error}
        </div>
      )}
      {plan && (
        <div className="mt-8 p-4 bg-purple-50 border-l-4 border-purple-400 text-purple-900 rounded">
          {plan}
        </div>
      )}
    </div>
  );
}
