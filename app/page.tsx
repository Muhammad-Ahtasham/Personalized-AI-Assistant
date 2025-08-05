"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import LearningPlanDisplay from "@/components/LearningPlanDisplay";
import QuizDisplay from "@/components/QuizDisplay";
import { useAlertContext } from "@/components/AlertProvider";

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
}

function HomePageContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useAlertContext();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  
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
    try {
      console.log("Sending request to generate plan for topic:", topic);
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
      
      if (!res.ok) {
        console.error("API error:", data);
        throw new Error(data.error || "Failed to generate plan");
      }
      
      // Validate the generated plan
      const planContent = data.plan;
      if (!planContent || 
          planContent.trim() === "" || 
          planContent.toLowerCase().includes("no plan generated") ||
          planContent.toLowerCase().includes("failed to generate") ||
          planContent.length < 50) {
        throw new Error("Failed to generate a proper learning plan. Please try again.");
      }
      
      setPlan(planContent);
      
      // Only save if we have a valid plan and user is signed in
      if (user && planContent && planContent.trim() !== "") {
        const saveRes = await fetch("/api/save-learning-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, content: planContent, clerkId: user.id }),
        });
        if (saveRes.ok) showSuccess("Learning plan saved to your dashboard!");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error generating plan:", error);
      if (error.message.includes("Authentication required")) {
        showError("Please sign in to generate learning plans. Click the 'Sign In' button in the top right.");
      } else if (error.message.includes("OpenRouter API key not set")) {
        showError("API configuration error. Please contact support.");
      } else if (error.message.includes("OpenRouter API error")) {
        showError("AI service temporarily unavailable. Please try again later.");
      } else {
        showError(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      showError("Please enter a topic for the quiz");
      return;
    }
    
    setQuizLoading(true);
    setQuiz(null);
    setUserAnswers([]);
    setQuizFeedback([]);
    setExplanations([]);
    
    try {
      console.log("Sending request to generate quiz for topic:", topic);
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      
      console.log("Quiz response status:", res.status);
      const data = await res.json();
      console.log("Quiz response data:", data);
      
      if (!res.ok) {
        console.error("Quiz API error:", data);
        throw new Error(data.error || "Failed to generate quiz");
      }
      
      if (Array.isArray(data.quiz) && data.quiz.length > 0) {
        console.log("Setting quiz with", data.quiz.length, "questions");
        setQuiz(data.quiz);
      } else {
        console.log("Invalid quiz format or empty quiz");
        setQuiz(null);
        showError("Failed to generate quiz. Please try again.");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error generating quiz:", error);
      setQuiz(null);
      setQuizFeedback([]);
      if (error.message.includes("Authentication required")) {
        showError("Please sign in to generate quizzes. Click the 'Sign In' button in the top right.");
      } else if (error.message.includes("OpenRouter API key not set")) {
        showError("API configuration error. Please contact support.");
      } else if (error.message.includes("OpenRouter API error")) {
        showError("AI service temporarily unavailable. Please try again later.");
      } else {
        showError(error.message || "Failed to generate quiz. Please try again.");
      }
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
      if (saveRes.ok) showSuccess("Quiz result saved to your dashboard!");
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
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Explanation API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch explanation");
      }
      
      const data = await res.json();
      const newExplanations = [...explanations];
      newExplanations[qIdx] = data.explanation || "No explanation available.";
      setExplanations(newExplanations);
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching explanation:", error);
      const newExplanations = [...explanations];
      newExplanations[qIdx] = error.message || "Failed to fetch explanation.";
      setExplanations(newExplanations);
      
      // Show error alert for authentication issues
      if (error.message.includes("Authentication required")) {
        showError("Please sign in to get explanations for wrong answers.");
      } else if (error.message.includes("OpenRouter API")) {
        showError("AI service temporarily unavailable. Please try again later.");
      }
    } finally {
      setExplanationLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-yellow-accent">Personalized Study Assistant</h1>
          
          {!user && (
            <div className="mb-8 p-6 card-dark">
              <h2 className="text-xl font-semibold mb-4 text-center">Welcome! Please sign in to continue</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/sign-in"
                  className="btn-primary text-center"
                >
                  Sign In with Email
                </a>
                <a
                  href="/face-sign-in"
                  className="btn-secondary text-center"
                >
                  Sign In with Face
                </a>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a href="/sign-up" className="text-green-accent hover:underline">Sign up with email</a>
                {" "}or{" "}
                <a href="/face-sign-up" className="text-green-accent hover:underline">sign up with face</a>
              </div>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                <a href="/test-face-api" className="text-green-accent hover:underline">Test Face API</a>
              </div>
            </div>
          )}
          

          
          {!user && (
            <div className="mb-6 p-4 bg-secondary border border-border text-muted-foreground rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-accent rounded-full"></div>
                <span className="font-medium">Sign in to use all features</span>
              </div>
              <p className="text-sm">Generate learning plans and quizzes, save your progress, and access your dashboard.</p>
            </div>
          )}

          {user && (
            <div className="mb-6 p-4 bg-secondary border border-border text-foreground rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-accent rounded-full"></div>
                    <span className="font-medium">Signed in as {user.emailAddresses[0]?.emailAddress}</span>
                  </div>
                  <p className="text-sm">You can now generate and save learning plans and quizzes.</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/test-config');
                      const data = await res.json();
                      console.log('Configuration test:', data);
                      alert(`Config Test:\nOpenRouter: ${data.config.openRouterKey}\nDatabase: ${data.config.databaseUrl}\nOpenRouter Test: ${data.openRouterTest}`);
                    } catch (error) {
                      console.error('Test failed:', error);
                      alert('Test failed. Check console for details.');
                    }
                  }}
                  className="px-3 py-1 bg-secondary text-foreground text-xs rounded hover:bg-yellow-accent hover:text-black active:bg-yellow-accent active:text-black transition-colors"
                >
                  Test Config
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/health');
                      const data = await res.json();
                      console.log('Health check:', data);
                      alert(`Health Check:\nStatus: ${data.status}\nEnvironment: ${data.environment}\nOpenRouter: ${data.openRouterKey}`);
                    } catch (error) {
                      console.error('Health check failed:', error);
                      alert('Health check failed. Check console for details.');
                    }
                  }}
                  className="px-3 py-1 bg-secondary text-foreground text-xs rounded hover:bg-muted transition-colors ml-2"
                >
                  Health Check
                </button>
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
                className="input-dark w-full p-4"
                placeholder="e.g. Linear Algebra, React, World War II..."
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmit}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !topic.trim()}
              >
                {loading ? "Generating..." : "Generate Learning Plan"}
              </button>
              <button
                onClick={handleGenerateQuiz}
                className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quizLoading || !topic.trim()}
              >
                {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
              </button>
            </div>
          </div>



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
