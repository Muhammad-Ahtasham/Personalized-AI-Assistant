"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import LearningPlanDisplay from "@/components/LearningPlanDisplay";
import QuizDisplay from "@/components/QuizDisplay";

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
}

function HomePageContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  
  // Quiz generation states
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<string[]>([]);
  const [explanations, setExplanations] = useState<(string | null)[]>([]);
  const [explanationLoading, setExplanationLoading] = useState<number | null>(null);

  // Handle URL parameters for topic
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPlan(null);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data, " Here is data")
        throw new Error(data.error || "Failed to generate plan");
      }
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
    if (!topic.trim()) {
      setError("Please enter a topic for the quiz");
      return;
    }
    
    setQuizLoading(true);
    setQuiz(null);
    setUserAnswers([]);
    setQuizFeedback([]);
    setSaveMsg(null);
    setExplanations([]);
    setError(null);
    
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      
      console.log("Quiz data received:", data);
      console.log("Quiz type:", typeof data.quiz);
      console.log("Quiz value:", data.quiz);
      
      if (Array.isArray(data.quiz) && data.quiz.length > 0) {
        console.log("Setting quiz with", data.quiz.length, "questions");
        setQuiz(data.quiz);
      } else {
        console.log("Invalid quiz format or empty quiz");
        setQuiz(null);
        setError("Failed to generate quiz. Please try again.");
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-primary">Personalized Study Assistant</h1>
          
          {!user && (
            <div className="mb-8 p-6 bg-card text-card-foreground border border-border rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-center">Welcome! Please sign in to continue</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/sign-in"
                  className="bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors text-center"
                >
                  Sign In with Email
                </a>
                <a
                  href="/face-sign-in"
                  className="bg-accent text-accent-foreground font-semibold py-3 px-6 rounded-lg hover:bg-accent/80 transition-colors text-center"
                >
                  Sign In with Face
                </a>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a href="/sign-up" className="text-primary hover:underline">Sign up with email</a>
                {" "}or{" "}
                <a href="/face-sign-up" className="text-primary hover:underline">sign up with face</a>
              </div>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                <a href="/test-face-api" className="text-primary hover:underline">Test Face API</a>
              </div>
            </div>
          )}
          

          
          <div className="space-y-6 mb-8">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-lg font-medium text-foreground">
                What do you want to learn or test?
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full p-4 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                placeholder="e.g. Linear Algebra, React, World War II..."
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !topic.trim()}
              >
                {loading ? "Generating..." : "Generate Learning Plan"}
              </button>
              <button
                onClick={handleGenerateQuiz}
                className="flex-1 bg-accent text-accent-foreground font-semibold py-4 px-6 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quizLoading || !topic.trim()}
              >
                {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {error}
            </div>
          )}
          
          {saveMsg && (
            <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-800 rounded-lg">
              {saveMsg}
            </div>
          )}

          {plan && (
            <LearningPlanDisplay 
              plan={plan}
            />
          )}

          {quiz && quiz.length > 0 && (
            <QuizDisplay
              quiz={quiz}
              userAnswers={userAnswers}
              quizFeedback={quizFeedback}
              explanations={explanations}
              explanationLoading={explanationLoading}
              onAnswer={handleAnswer}
              onSubmitQuiz={handleSubmitQuiz}
              onGetExplanation={handleGetExplanation}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
