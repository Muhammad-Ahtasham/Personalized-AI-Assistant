"use client";
import React from "react";
import { AcademicCapIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon } from "@heroicons/react/24/outline";

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
}

interface QuizDisplayProps {
  quiz: QuizQuestion[];
  userAnswers: string[];
  quizFeedback: string[];
  explanations: (string | null)[];
  explanationLoading: number | null;
  onAnswer: (qIdx: number, choice: string) => void;
  onSubmitQuiz: () => void;
  onGetExplanation: (qIdx: number) => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({
  quiz,
  userAnswers,
  quizFeedback,
  explanations,
  explanationLoading,
  onAnswer,
  onSubmitQuiz,
  onGetExplanation,
}) => {
  const getScore = () => {
    return quiz.reduce((acc, q, i) => acc + (userAnswers[i] === q.answer ? 1 : 0), 0);
  };

  const getScorePercentage = () => {
    return Math.round((getScore() / quiz.length) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <AcademicCapIcon className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-bold text-accent">Quiz</h2>
        </div>
        {quizFeedback.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Score:</span>
              <span className={`text-lg font-bold ${getScoreColor(getScorePercentage())}`}>
                {getScore()}/{quiz.length} ({getScorePercentage()}%)
              </span>
            </div>
            {getScorePercentage() >= 80 && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Excellent!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quiz Questions */}
      <form onSubmit={e => { e.preventDefault(); onSubmitQuiz(); }} className="space-y-6">
        {quiz.map((question, qIdx) => (
          <div key={qIdx} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Question Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary text-sm font-bold rounded-full flex items-center justify-center">
                  {qIdx + 1}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground leading-relaxed">
                    {question.question}
                  </h3>
                </div>
              </div>
            </div>

            {/* Choices */}
            <div className="p-6 space-y-3">
              {question.choices.map((choice, choiceIdx) => {
                const isSelected = userAnswers[qIdx] === choice;
                const isCorrect = choice === question.answer;
                const showFeedback = quizFeedback.length > 0;
                
                let choiceStyle = "border-border hover:bg-muted/50";
                if (showFeedback) {
                  if (isCorrect) {
                    choiceStyle = "border-green-200 bg-green-50/50";
                  } else if (isSelected && !isCorrect) {
                    choiceStyle = "border-red-200 bg-red-50/50";
                  }
                }

                return (
                  <label
                    key={choiceIdx}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${choiceStyle} ${
                      !showFeedback ? 'hover:shadow-sm' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q${qIdx}`}
                      value={choice}
                      checked={isSelected}
                      onChange={() => onAnswer(qIdx, choice)}
                      disabled={showFeedback}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="flex-1 text-foreground leading-relaxed">{choice}</span>
                    {showFeedback && isCorrect && (
                      <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </label>
                );
              })}
            </div>

            {/* Feedback */}
            {quizFeedback[qIdx] && (
              <div className="px-6 pb-6">
                <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {quizFeedback[qIdx].startsWith("✅") ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium text-sm">
                      {quizFeedback[qIdx].startsWith("✅") ? "Correct!" : "Incorrect"}
                    </span>
                  </div>
                  
                  {quizFeedback[qIdx].startsWith("❌") && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Correct answer: <span className="font-medium text-foreground">{question.answer}</span>
                      </p>
                      
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-sm disabled:opacity-50"
                        onClick={() => onGetExplanation(qIdx)}
                        disabled={!!explanations[qIdx] || explanationLoading === qIdx}
                      >
                        {explanationLoading === qIdx ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : explanations[qIdx] ? (
                          <>
                            <LightBulbIcon className="w-4 h-4" />
                            Explanation Shown
                          </>
                        ) : (
                          <>
                            <LightBulbIcon className="w-4 h-4" />
                            Get Explanation
                          </>
                        )}
                      </button>
                      
                      {explanations[qIdx] && (
                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <LightBulbIcon className="w-4 h-4 text-accent" />
                            <span className="text-sm font-medium text-accent">Explanation</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {explanations[qIdx]}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Submit Button */}
        {quizFeedback.length === 0 && (
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold py-3 px-8 rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <AcademicCapIcon className="w-5 h-5" />
              Submit Quiz
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default QuizDisplay; 