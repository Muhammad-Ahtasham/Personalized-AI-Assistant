"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Trash2, X } from "lucide-react";
import LearningPlanDisplay from "@/components/LearningPlanDisplay";
import QuizDisplay from "@/components/QuizDisplay";
import { useAlertContext } from "@/components/AlertProvider";
import { usePlan } from "@/hooks/usePlan";
import { useQuiz } from "@/hooks/useQuiz";

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
}

function HomePageContent() {
  const { isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useAlertContext();
  const [topic, setTopic] = useState("");
  
  // Use custom hooks for plan and quiz management
  const { 
    planData, 
    setPlan, 
    clearPlan, 
    loading: planLoading, 
    setLoading: setPlanLoading,
    getTimeSinceCreated: getPlanTimeSinceCreated
  } = usePlan();
  
  const { 
    quizData, 
    setQuiz, 
    clearQuiz, 
    updateUserAnswer, 
    updateQuizFeedback, 
    updateExplanation,
    loading: quizLoading, 
    setLoading: setQuizLoading,
    explanationLoading, 
    setExplanationLoading,
    getTimeSinceCreated: getQuizTimeSinceCreated
  } = useQuiz();

  // Clear plan and quiz when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      clearPlan();
      clearQuiz();
      setTopic("");
    }
  }, [isSignedIn, clearPlan, clearQuiz]);

  // Handle URL parameters for topic
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [searchParams]);

  // Set topic from saved plan/quiz if available
  useEffect(() => {
    if (planData?.topic && !topic) {
      setTopic(planData.topic);
    } else if (quizData?.topic && !topic) {
      setTopic(quizData.topic);
    }
  }, [planData, quizData, topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanLoading(true);
    clearPlan();
    clearQuiz();
    
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

      setPlan(topic, planContent);

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
      setPlanLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      showError("Please enter a topic first.");
      return;
    }

    setQuizLoading(true);
    clearQuiz();
    
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      if (!data.quiz || data.quiz.length === 0) {
        throw new Error("No quiz questions were generated. Please try again.");
      }

      setQuiz(topic, data.quiz);
      showSuccess("Quiz generated successfully!");

      // Save quiz result if user is signed in
      if (user) {
        const saveRes = await fetch("/api/save-quiz-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            questions: data.quiz,
            answers: [],
            score: 0,
            clerkId: user.id,
          }),
        });
        if (saveRes.ok) showSuccess("Quiz saved to your dashboard!");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error generating quiz:", error);
      if (error.message.includes("Authentication required")) {
        showError("Please sign in to generate quizzes. Click the 'Sign In' button in the top right.");
      } else if (error.message.includes("OpenRouter API")) {
        showError("AI service temporarily unavailable. Please try again later.");
      } else {
        showError(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = (qIdx: number, choice: string) => {
    updateUserAnswer(qIdx, choice);
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;

    const feedback = quizData.quiz.map((question, index) => {
      const userAnswer = quizData.userAnswers[index];
      if (userAnswer === question.answer) {
        return "✅ Correct!";
      } else {
        return `❌ Incorrect. The correct answer is: ${question.answer}`;
      }
    });

    updateQuizFeedback(feedback);

    // Save quiz result if user is signed in
    if (user) {
      const score = quizData.quiz.reduce((acc, q, i) => acc + (quizData.userAnswers[i] === q.answer ? 1 : 0), 0);
      const saveRes = await fetch("/api/save-quiz-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizData.topic,
          questions: quizData.quiz,
          answers: quizData.userAnswers,
          score,
          clerkId: user.id,
        }),
      });
      if (saveRes.ok) showSuccess("Quiz result saved to your dashboard!");
    }
  };

  const handleGetExplanation = async (qIdx: number) => {
    if (!quizData) return;
    
    setExplanationLoading(qIdx);
    try {
      const res = await fetch("/api/explain-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: quizData.quiz[qIdx].question,
          answer: quizData.quiz[qIdx].answer,
          userAnswer: quizData.userAnswers[qIdx],
          topic: quizData.topic,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Explanation API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch explanation");
      }

      const data = await res.json();
      updateExplanation(qIdx, data.explanation || "No explanation available.");
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching explanation:", error);
      updateExplanation(qIdx, error.message || "Failed to fetch explanation.");

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

  const handleClearPlan = () => {
    clearPlan();
    showSuccess("Learning plan cleared!");
  };

  const handleClearQuiz = () => {
    clearQuiz();
    showSuccess("Quiz cleared!");
  };

  const handleClearAll = () => {
    clearPlan();
    clearQuiz();
    showSuccess("All content cleared!");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center text-yellow-accent">
            Personalized Study Assistant
          </h1>

          {!user && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 card-dark">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Welcome! Please sign in to continue</h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <a
                  href="/sign-in"
                  className="btn-primary text-center text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
                >
                  Sign In with Email
                </a>
                <a
                  href="/face-sign-in"
                  className="btn-primary text-center text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
                >
                  Sign In with Face
                </a>
              </div>
              <div className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a href="/sign-up" className="text-green-accent hover:underline">Sign up with email</a>
                {" "}or{" "}
                <a href="/face-sign-up" className="text-green-accent hover:underline">sign up with face</a>
              </div>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-base sm:text-lg font-medium text-foreground">
                What do you want to learn or test?
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="input-dark w-full p-3 sm:p-4 text-sm sm:text-base"
                placeholder="e.g. Linear Algebra, React, World War II..."
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmit}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
                disabled={planLoading || !topic.trim()}
              >
                {planLoading ? "Generating..." : "Generate Learning Plan"}
              </button>
              <button
                onClick={handleGenerateQuiz}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
                disabled={quizLoading || !topic.trim()}
              >
                {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
              </button>
            </div>
          </div>

          {/* Clear All Button - Only show if there's content to clear */}
          {(planData || quizData) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 p-3 bg-yellow-accent/10 border border-yellow-accent/20 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-accent rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-accent font-medium">
                    Saved content for: <span className="text-white">{planData?.topic || quizData?.topic}</span>
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {planData && `Plan created ${getPlanTimeSinceCreated()}`}
                  {planData && quizData && ' • '}
                  {quizData && `Quiz created ${getQuizTimeSinceCreated()}`}
                </div>
              </div>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-xs"
                title="Clear all content"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
          )}

          {planData && (
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={handleClearPlan}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
                  title="Clear learning plan"
                >
                  <X size={16} />
                </button>
              </div>
              <LearningPlanDisplay plan={planData.plan} />
            </div>
          )}

          {quizData && quizData.quiz.length > 0 && (
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={handleClearQuiz}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
                  title="Clear quiz"
                >
                  <X size={16} />
                </button>
              </div>
              <QuizDisplay
                quiz={quizData.quiz}
                userAnswers={quizData.userAnswers}
                quizFeedback={quizData.quizFeedback}
                explanations={quizData.explanations}
                explanationLoading={explanationLoading}
                onAnswer={handleAnswer}
                onSubmitQuiz={handleSubmitQuiz}
                onGetExplanation={handleGetExplanation}
              />
            </div>
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
