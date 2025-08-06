"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useAlertContext } from "@/components/AlertProvider";
import { 
  BookOpenIcon, 
  AcademicCapIcon, 
  ChartBarIcon, 
  ClockIcon,
  UserIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  LightBulbIcon,
  LinkIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

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
  const { showSuccess, showError } = useAlertContext();
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<string | null>(null);
  const planRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const router = useRouter();

  const togglePlan = (planId: string) => {
    if (expandedPlan === planId) {
      setExpandedPlan(null);
    } else {
      setExpandedPlan(planId);
    }
  };

  // Scroll to the newly opened plan
  useEffect(() => {
    if (expandedPlan && planRefs.current[expandedPlan]) {
      const element = planRefs.current[expandedPlan];
      if (element) {
        // Add a small delay to ensure the accordion animation has started
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }, 100);
      }
    }
  }, [expandedPlan]);

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this learning plan? This action cannot be undone.')) {
      return;
    }

    setDeletingPlan(planId);
    try {
      const response = await fetch('/api/delete-learning-plan', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove the plan from the state
        setPlans(plans.filter(plan => plan.id !== planId));
        // Remove from expanded plans if it was expanded
        if (expandedPlan === planId) {
          setExpandedPlan(null);
        }
      } else {
        showError(data.error || 'Failed to delete learning plan');
      }
    } catch (error) {
      console.error('Error deleting learning plan:', error);
      showError('Failed to delete learning plan');
    } finally {
      setDeletingPlan(null);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz result? This action cannot be undone.')) {
      return;
    }

    setDeletingQuiz(quizId);
    try {
      const response = await fetch('/api/delete-quiz-result', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove the quiz from the state
        setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      } else {
        showError(data.error || 'Failed to delete quiz result');
      }
    } catch (error) {
      console.error('Error deleting quiz result:', error);
      showError('Failed to delete quiz result');
    } finally {
      setDeletingQuiz(null);
    }
  };

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
      try {
        // First, sync user to database
        const syncResponse = await fetch("/api/auth/sync-user-to-database", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!syncResponse.ok) {
          console.error("Failed to sync user to database");
        }
        
        // Clean up any failed plans
        try {
          await fetch("/api/cleanup-failed-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        } catch (cleanupError) {
          console.error("Failed to cleanup failed plans:", cleanupError);
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
        showError(error.message || "Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };
    
    syncUserAndFetchHistory();
  }, [user, isSignedIn, isLoaded, router]);

  // Show loading while Clerk is loading or user is not signed in
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const formatContent = (content: string) => {
    // Remove markdown formatting and clean up the content
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/###\s*/g, '') // Remove headers
      .replace(/##\s*/g, '') // Remove subheaders
      .replace(/#\s*/g, '') // Remove single headers
      .replace(/---/g, '') // Remove separators
      .replace(/\n\n/g, '\n') // Remove double line breaks
      .replace(/Personalized Learning Plan:\s*/gi, '') // Remove plan title
      .replace(/Face Recognition/gi, 'Face Recognition') // Keep topic name clean
      .trim();
  };

  const parseLearningPlan = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const sections: { title: string; items: string[] }[] = [];
    let currentSection = { title: 'Overview', items: [] as string[] };
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      
      // Check for section headers (remove markdown formatting)
      const cleanHeader = cleanLine
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/###\s*/g, '')
        .replace(/##\s*/g, '')
        .replace(/#\s*/g, '');
      
      if (cleanHeader.includes('Level') || cleanHeader.includes('Objective') || 
          cleanHeader.includes('Beginner') || cleanHeader.includes('Intermediate') || 
          cleanHeader.includes('Advanced') || cleanHeader.includes('Stage')) {
        if (currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { title: cleanHeader, items: [] };
      } else if (cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
        // Bullet points - clean up the content
        const cleanItem = cleanLine
          .replace(/^[-•]\s*/, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1');
        currentSection.items.push(cleanItem);
      } else if (cleanLine.match(/^\d+\./)) {
        // Numbered lists - clean up the content
        const cleanItem = cleanLine
          .replace(/^\d+\.\s*/, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1');
        currentSection.items.push(cleanItem);
      } else if (cleanLine.includes('Resource:') || cleanLine.includes('Tip:') || 
                 cleanLine.includes('Resource') || cleanLine.includes('Tip')) {
        // Resources and tips - clean up the content
        const cleanItem = cleanLine
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1');
        currentSection.items.push(cleanItem);
      } else if (cleanLine.length > 0 && !cleanLine.includes('Personalized Learning Plan')) {
        // Regular content - clean up the content
        const cleanItem = cleanLine
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/###\s*/g, '')
          .replace(/##\s*/g, '')
          .replace(/#\s*/g, '');
        currentSection.items.push(cleanItem);
      }
    }
    
    if (currentSection.items.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-accent rounded-xl shadow-lg">
                <UserIcon className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User'}!
                </h1>
                <p className="text-muted-foreground mt-1">Track your learning progress and achievements</p>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 card-dark hover:bg-muted transition-all duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-dark">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-accent/20 rounded-lg">
                <BookOpenIcon className="w-6 h-6 text-yellow-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Learning Plans</p>
                <p className="text-2xl font-bold text-white">{plans.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card-dark">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-accent/20 rounded-lg">
                <AcademicCapIcon className="w-6 h-6 text-yellow-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Quizzes Taken</p>
                <p className="text-2xl font-bold text-white">{quizzes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card-dark">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-accent/20 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-yellow-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-white">
                  {quizzes.length > 0 
                    ? Math.round(quizzes.reduce((sum, quiz) => sum + quiz.score, 0) / quizzes.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Plans Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-accent/20 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-yellow-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white">Learning Plans</h2>
          </div>
          
          {loading ? (
            <div className="card-dark p-8">
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your learning plans...</p>
                </div>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="card-dark p-8 text-center">
              <BookOpenIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No learning plans yet</h3>
              <p className="text-muted-foreground">Start your learning journey by creating your first personalized plan!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => {
                const sections = parseLearningPlan(plan.content);
                const isExpanded = expandedPlan === plan.id;
                
                return (
                  <div 
                    key={plan.id} 
                    ref={(el) => { planRefs.current[plan.id] = el; }}
                    className="card-dark overflow-hidden"
                  >
                    <button
                      onClick={() => togglePlan(plan.id)}
                      className="w-full p-6 border-b border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-yellow-accent/20 rounded-lg">
                            <BookOpenIcon className="w-5 h-5 text-yellow-accent" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-xl font-semibold text-white mb-1">{plan.topic}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                {new Date(plan.createdAt).toLocaleDateString()}
                              </div>
                              <span className="px-2 py-1 bg-yellow-accent/20 text-yellow-accent text-xs font-medium rounded-full">
                                {sections.length} sections
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-yellow-accent/20 text-yellow-accent text-sm font-medium rounded-full">
                            Active
                          </span>
                          {isExpanded ? (
                            <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-6 bg-muted">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white">Plan Details</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlan(plan.id);
                            }}
                            disabled={deletingPlan === plan.id}
                            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingPlan === plan.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">Delete Plan</span>
                          </button>
                        </div>
                        <div className="space-y-4">
                          {sections.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="card-dark p-4">
                              <h4 className="font-semibold text-white mb-3 text-lg">{section.title}</h4>
                              <div className="space-y-2">
                                {section.items.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-2 h-2 bg-yellow-accent rounded-full mt-2"></div>
                                    <p className="text-muted-foreground leading-relaxed">{item}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quiz Results Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-accent/20 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-yellow-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white">Quiz Results</h2>
          </div>
          
          {loading ? (
            <div className="card-dark p-8">
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your quiz results...</p>
                </div>
              </div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="card-dark p-8 text-center">
              <AcademicCapIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No quiz results yet</h3>
              <p className="text-muted-foreground">Take your first quiz to see your results here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="card-dark p-6 relative group">
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    disabled={deletingQuiz === quiz.id}
                    className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deletingQuiz === quiz.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">{quiz.topic}</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      quiz.score >= 80 ? 'bg-yellow-accent/20 text-yellow-accent' :
                      quiz.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {quiz.score}%
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Questions</span>
                      <span>{quiz.questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Completed</span>
                      <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      {quiz.score >= 80 ? (
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                      ) : quiz.score >= 60 ? (
                        <CheckCircleIcon className="w-4 h-4 text-yellow-accent" />
                      ) : (
                        <LightBulbIcon className="w-4 h-4 text-blue-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {quiz.score >= 80 ? 'Excellent!' : 
                         quiz.score >= 60 ? 'Good job!' : 'Keep learning!'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 