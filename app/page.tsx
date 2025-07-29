"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
}

export default function HomePage() {
  const { user } = useUser();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<string[]>([]);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<(string | null)[]>([]);
  const [explanationLoading, setExplanationLoading] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPlan(null);
    setError(null);
    setQuiz(null);
    setUserAnswers([]);
    setQuizFeedback([]);
    setSaveMsg(null);
    setExplanations([]);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      setPlan(data.plan);
      if (user) {
        const saveRes = await fetch("/api/save-learning-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, content: data.plan, clerkId: user.id }),
        });
        if (saveRes.ok) setSaveMsg("Learning plan saved to your dashboard!");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setQuiz(null);
    setUserAnswers([]);
    setQuizFeedback([]);
    setSaveMsg(null);
    setExplanations([]);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      if (typeof data.quiz === "string") {
        setQuiz(JSON.parse(data.quiz));
      } else {
        setQuiz(data.quiz);
      }
    } catch (err) {
      const error = err as Error;
      setQuiz(null);
      setQuizFeedback([]);
      setError(error.message || "Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = (qIdx: number, choice: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = choice;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    const feedback = quiz.map((q, i) => {
      if (userAnswers[i] === undefined) return "No answer selected.";
      return userAnswers[i] === q.answer ? "✅ Correct!" : `❌ Incorrect. Correct answer: ${q.answer}`;
    });
    setQuizFeedback(feedback);
    setExplanations(Array(quiz.length).fill(null));
    if (user) {
      const score = quiz.reduce((acc, q, i) => acc + (userAnswers[i] === q.answer ? 1 : 0), 0);
      const saveRes = await fetch("/api/save-quiz-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          questions: quiz,
          answers: userAnswers,
          score,
          clerkId: user.id,
        }),
      });
      if (saveRes.ok) setSaveMsg("Quiz result saved to your dashboard!");
    }
  };

  const handleGetExplanation = async (qIdx: number) => {
    if (!quiz) return;
    setExplanationLoading(qIdx);
    try {
      const res = await fetch("/api/explain-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: quiz[qIdx].question,
          answer: quiz[qIdx].answer,
          userAnswer: userAnswers[qIdx],
          topic,
        }),
      });
      const data = await res.json();
      const newExplanations = [...explanations];
      newExplanations[qIdx] = data.explanation || "No explanation available.";
      setExplanations(newExplanations);
    } catch {
      const newExplanations = [...explanations];
      newExplanations[qIdx] = "Failed to fetch explanation.";
      setExplanations(newExplanations);
    } finally {
      setExplanationLoading(null);
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
      {saveMsg && (
        <div className="mt-6 p-3 bg-green-100 border-l-4 border-green-400 text-green-800 rounded">
          {saveMsg}
        </div>
      )}
      {plan && (
        <div className="mt-8 p-4 bg-purple-50 border-l-4 border-purple-400 text-purple-900 rounded">
          <div className="mb-4 whitespace-pre-line">{plan}</div>
          <button
            onClick={handleGenerateQuiz}
            className="mt-2 bg-yellow-400 text-purple-900 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-500 transition"
            disabled={quizLoading}
          >
            {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
          </button>
        </div>
      )}
      {quiz && quiz.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-purple-700">Quiz</h2>
          <form onSubmit={e => { e.preventDefault(); handleSubmitQuiz(); }}>
            {quiz.map((q, i) => (
              <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg border border-purple-100">
                <div className="font-medium mb-2">{i + 1}. {q.question}</div>
                <div className="flex flex-col gap-2">
                  {q.choices.map((choice, j) => (
                    <label key={j} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q${i}`}
                        value={choice}
                        checked={userAnswers[i] === choice}
                        onChange={() => handleAnswer(i, choice)}
                        disabled={quizFeedback.length > 0}
                      />
                      {choice}
                    </label>
                  ))}
                </div>
                {quizFeedback[i] && (
                  <div className="mt-2 font-semibold text-sm text-purple-700">
                    {quizFeedback[i]}
                    {quizFeedback[i].startsWith("❌") && (
                      <>
                        <button
                          type="button"
                          className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-xs"
                          onClick={() => handleGetExplanation(i)}
                          disabled={!!explanations[i] || explanationLoading === i}
                        >
                          {explanationLoading === i ? "Loading..." : explanations[i] ? "Explanation Shown" : "Get Explanation"}
                        </button>
                        {explanations[i] && (
                          <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-400 text-blue-900 rounded text-sm">
                            {explanations[i]}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {quizFeedback.length === 0 && (
              <button
                type="submit"
                className="bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition"
              >
                Submit Quiz
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
