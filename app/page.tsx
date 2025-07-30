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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-primary">Personalized Study Assistant</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-lg font-medium text-foreground">
                What do you want to learn?
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
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Learning Plan"}
            </button>
          </form>

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
            <div className="mb-8 p-6 bg-card text-card-foreground border border-border rounded-lg shadow-sm">
              <div className="mb-6 whitespace-pre-line text-foreground leading-relaxed">{plan}</div>
              <button
                onClick={handleGenerateQuiz}
                className="bg-accent text-accent-foreground font-semibold py-3 px-6 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quizLoading}
              >
                {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
              </button>
            </div>
          )}

          {quiz && quiz.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary">Quiz</h2>
              <form onSubmit={e => { e.preventDefault(); handleSubmitQuiz(); }}>
                {quiz.map((q, i) => (
                  <div key={i} className="mb-6 p-6 bg-card text-card-foreground border border-border rounded-lg shadow-sm">
                    <div className="font-semibold mb-4 text-lg">{i + 1}. {q.question}</div>
                    <div className="space-y-3">
                      {q.choices.map((choice, j) => (
                        <label key={j} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name={`q${i}`}
                            value={choice}
                            checked={userAnswers[i] === choice}
                            onChange={() => handleAnswer(i, choice)}
                            disabled={quizFeedback.length > 0}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-foreground">{choice}</span>
                        </label>
                      ))}
                    </div>
                    {quizFeedback[i] && (
                      <div className="mt-4 p-4 bg-muted/50 border border-border rounded-lg">
                        <div className="font-semibold text-sm text-foreground mb-2">
                          {quizFeedback[i]}
                        </div>
                        {quizFeedback[i].startsWith("❌") && (
                          <>
                            <button
                              type="button"
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                              onClick={() => handleGetExplanation(i)}
                              disabled={!!explanations[i] || explanationLoading === i}
                            >
                              {explanationLoading === i ? "Loading..." : explanations[i] ? "Explanation Shown" : "Get Explanation"}
                            </button>
                            {explanations[i] && (
                              <div className="mt-3 p-3 bg-accent/20 border border-accent/30 text-accent-foreground rounded-md text-sm">
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
                    className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Submit Quiz
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
