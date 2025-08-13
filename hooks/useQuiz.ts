import { useState, useEffect } from 'react';

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
}

interface QuizData {
  topic: string;
  quiz: QuizQuestion[];
  userAnswers: string[];
  quizFeedback: string[];
  explanations: (string | null)[];
  timestamp: number;
}

export const useQuiz = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState<number | null>(null);

  // Load quiz from localStorage on mount
  useEffect(() => {
    const savedQuiz = localStorage.getItem('studymate_current_quiz');
    if (savedQuiz) {
      try {
        const parsed = JSON.parse(savedQuiz);
        // Check if quiz is less than 24 hours old
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          setQuizData(parsed);
        } else {
          // Clear old quiz
          localStorage.removeItem('studymate_current_quiz');
        }
      } catch (error) {
        console.error('Error parsing saved quiz:', error);
        localStorage.removeItem('studymate_current_quiz');
      }
    }
  }, []);

  const setQuiz = (topic: string, quiz: QuizQuestion[]) => {
    const quizData: QuizData = {
      topic,
      quiz,
      userAnswers: [],
      quizFeedback: [],
      explanations: Array(quiz.length).fill(null),
      timestamp: Date.now(),
    };
    setQuizData(quizData);
    localStorage.setItem('studymate_current_quiz', JSON.stringify(quizData));
  };

  const clearQuiz = () => {
    setQuizData(null);
    localStorage.removeItem('studymate_current_quiz');
  };

  const updateUserAnswer = (questionIndex: number, answer: string) => {
    if (quizData) {
      const newUserAnswers = [...quizData.userAnswers];
      newUserAnswers[questionIndex] = answer;

      const updatedQuizData = {
        ...quizData,
        userAnswers: newUserAnswers,
        timestamp: Date.now(),
      };
      setQuizData(updatedQuizData);
      localStorage.setItem('studymate_current_quiz', JSON.stringify(updatedQuizData));
    }
  };

  const updateQuizFeedback = (feedback: string[]) => {
    if (quizData) {
      const updatedQuizData = {
        ...quizData,
        quizFeedback: feedback,
        timestamp: Date.now(),
      };
      setQuizData(updatedQuizData);
      localStorage.setItem('studymate_current_quiz', JSON.stringify(updatedQuizData));
    }
  };

  const updateExplanation = (questionIndex: number, explanation: string) => {
    if (quizData) {
      const newExplanations = [...quizData.explanations];
      newExplanations[questionIndex] = explanation;

      const updatedQuizData = {
        ...quizData,
        explanations: newExplanations,
        timestamp: Date.now(),
      };
      setQuizData(updatedQuizData);
      localStorage.setItem('studymate_current_quiz', JSON.stringify(updatedQuizData));
    }
  };

  const getTimeSinceCreated = () => {
    if (!quizData) return null;
    const now = Date.now();
    const diff = now - quizData.timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'More than 24 hours ago';
  };

  return {
    quizData,
    setQuiz,
    clearQuiz,
    updateUserAnswer,
    updateQuizFeedback,
    updateExplanation,
    loading,
    setLoading,
    explanationLoading,
    setExplanationLoading,
    getTimeSinceCreated,
  };
};
