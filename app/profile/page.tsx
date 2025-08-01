"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Award, 
  FileText, 
  Settings, 
  Edit3,
  Camera,
  Shield,
  Activity
} from "lucide-react";

interface UserStats {
  totalPlans: number;
  totalQuizzes: number;
  totalNotes: number;
  averageQuizScore: number;
  lastActive: string;
}

interface LearningPlan {
  id: string;
  topic: string;
  content: string;
  createdAt: string;
}

interface QuizResult {
  id: string;
  topic: string;
  score: number;
  createdAt: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentPlans, setRecentPlans] = useState<LearningPlan[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<QuizResult[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');
  
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    
    if (!user) return;
    
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Sync user to database first
        const syncResponse = await fetch("/api/auth/sync-user-to-database", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!syncResponse.ok) {
          console.error("Failed to sync user to database");
        }
        
        // Fetch user history and stats
        const clerkId = user.id;
        const res = await fetch("/api/user-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkId }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch user data");
        
        const plans = data.plans || [];
        const quizzes = data.quizzes || [];
        const notes = data.notes || [];
        
        // Calculate stats
        const totalPlans = plans.length;
        const totalQuizzes = quizzes.length;
        const totalNotes = notes.length;
        const averageQuizScore = quizzes.length > 0 
          ? Math.round(quizzes.reduce((sum: number, quiz: QuizResult) => sum + quiz.score, 0) / quizzes.length)
          : 0;
        
        const lastActive = plans.length > 0 || quizzes.length > 0 || notes.length > 0
          ? new Date(Math.max(
              ...plans.map((p: LearningPlan) => new Date(p.createdAt).getTime()),
              ...quizzes.map((q: QuizResult) => new Date(q.createdAt).getTime()),
              ...notes.map((n: Note) => new Date(n.updatedAt).getTime())
            )).toLocaleDateString()
          : "Never";
        
        setStats({
          totalPlans,
          totalQuizzes,
          totalNotes,
          averageQuizScore,
          lastActive
        });
        
        setRecentPlans(plans.slice(0, 3));
        setRecentQuizzes(quizzes.slice(0, 3));
        setRecentNotes(notes.slice(0, 3));
        
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, isSignedIn, isLoaded, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user?.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member since {new Date(user?.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Activity
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Learning Plans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPlans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quizzes Taken</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Notes Created</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Quiz Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageQuizScore}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Learning Plans */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Recent Learning Plans
            </h3>
            {recentPlans.length === 0 ? (
              <p className="text-gray-500 text-sm">No learning plans yet.</p>
            ) : (
              <div className="space-y-3">
                {recentPlans.map(plan => (
                  <div key={plan.id} className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800">{plan.topic}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{plan.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quiz Results */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Recent Quiz Results
            </h3>
            {recentQuizzes.length === 0 ? (
              <p className="text-gray-500 text-sm">No quiz results yet.</p>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map(quiz => (
                  <div key={quiz.id} className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800">{quiz.topic}</h4>
                    <p className="text-sm text-gray-600 mt-1">Score: {quiz.score}%</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Recent Notes
            </h3>
            {recentNotes.length === 0 ? (
              <p className="text-gray-500 text-sm">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map(note => (
                  <div key={note.id} className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800">{note.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
          
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <p className="text-gray-900">{user?.firstName || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <p className="text-gray-900">{user?.lastName || 'Not set'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user?.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>
            </div>

            {/* Authentication Methods */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Authentication Methods
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Email & Password</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Camera className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">Face Authentication</span>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Available</span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Account Actions
              </h4>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Edit3 className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Edit Profile</span>
                    </div>
                    <span className="text-xs text-purple-600">→</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">Setup Face Authentication</span>
                    </div>
                    <span className="text-xs text-yellow-600">→</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 