"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import ProfileEditModal from "@/components/ProfileEditModal";
import ChangePasswordModal from '@/components/ChangePasswordModal';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  const router = useRouter();

  const handleProfileUpdate = () => {
    // Force a refresh of the user data from Clerk
    // This will trigger the useEffect to re-run and fetch updated data
    setLoading(true);
    // Small delay to ensure the update has propagated
    setTimeout(() => {
      setLoading(false);
      // Force a re-render by updating a state
      setActiveTab(activeTab);
    }, 1000);
  };

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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="card-dark mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-accent to-yellow-500 rounded-full flex items-center justify-center overflow-hidden">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-black" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(user?.createdAt || '').toLocaleDateString()}
                </p>
              </div>
            </div>
            <a
              href="/dashboard"
              className="text-yellow-accent hover:text-yellow-500 font-medium transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="card-dark mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-yellow-accent text-yellow-accent'
                    : 'border-transparent text-muted-foreground hover:text-white hover:border-border'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-yellow-accent text-yellow-accent'
                    : 'border-transparent text-muted-foreground hover:text-white hover:border-border'
                }`}
              >
                Recent Activity
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-yellow-accent text-yellow-accent'
                    : 'border-transparent text-muted-foreground hover:text-white hover:border-border'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>
        </div>

        {loading && (
          <div className="card-dark text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Content Area */}
        <div className="w-full">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="card-dark">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-accent/20 rounded-lg">
                    <BookOpen className="w-6 h-6 text-yellow-accent" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Learning Plans</p>
                    <p className="text-2xl font-bold text-white">{stats.totalPlans}</p>
                  </div>
                </div>
              </div>

              <div className="card-dark">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-accent/20 rounded-lg">
                    <Award className="w-6 h-6 text-yellow-accent" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Quizzes Taken</p>
                    <p className="text-2xl font-bold text-white">{stats.totalQuizzes}</p>
                  </div>
                </div>
              </div>

              <div className="card-dark">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-accent/20 rounded-lg">
                    <FileText className="w-6 h-6 text-yellow-accent" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Notes Created</p>
                    <p className="text-2xl font-bold text-white">{stats.totalNotes}</p>
                  </div>
                </div>
              </div>

              <div className="card-dark">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-accent/20 rounded-lg">
                    <Activity className="w-6 h-6 text-yellow-accent" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Quiz Score</p>
                    <p className="text-2xl font-bold text-white">{stats.averageQuizScore}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Learning Plans */}
              <div className="card-dark">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-yellow-accent" />
                  Recent Learning Plans
                </h3>
                {recentPlans.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No learning plans yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentPlans.map(plan => (
                      <div key={plan.id} className="p-3 bg-yellow-accent/10 rounded-lg border border-yellow-accent/20">
                        <h4 className="font-medium text-yellow-accent">{plan.topic}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Quiz Results */}
              <div className="card-dark">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-accent" />
                  Recent Quiz Results
                </h3>
                {recentQuizzes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No quiz results yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentQuizzes.map(quiz => (
                      <div key={quiz.id} className="p-3 bg-yellow-accent/10 rounded-lg border border-yellow-accent/20">
                        <h4 className="font-medium text-yellow-accent">{quiz.topic}</h4>
                        <p className="text-sm text-muted-foreground mt-1">Score: {quiz.score}%</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Notes */}
              <div className="card-dark">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-accent" />
                  Recent Notes
                </h3>
                {recentNotes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No notes yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentNotes.map(note => (
                      <div key={note.id} className="p-3 bg-yellow-accent/10 rounded-lg border border-yellow-accent/20">
                        <h4 className="font-medium text-yellow-accent">{note.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
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
            <div className="card-dark">
              <h3 className="text-lg font-semibold text-white mb-6">Account Settings</h3>
              
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="border-b border-border pb-6">
                  <h4 className="text-md font-medium text-white mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">First Name</label>
                      <p className="text-white">{user?.firstName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Last Name</label>
                      <p className="text-white">{user?.lastName || 'Not set'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                      <p className="text-white">{user?.emailAddresses[0]?.emailAddress}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Profile Image</label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-accent to-yellow-500 rounded-full flex items-center justify-center overflow-hidden">
                          {user?.imageUrl ? (
                            <Image
                              src={user.imageUrl}
                              alt="Profile"
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-black" />
                          )}
                        </div>
                        <p className="text-white">{user?.imageUrl ? 'Image set' : 'No image set'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authentication Methods */}
                <div className="border-b border-border pb-6">
                  <h4 className="text-md font-medium text-white mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Authentication Methods
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-white">Email & Password</span>
                      </div>
                      <span className="text-xs bg-yellow-accent/20 text-yellow-accent px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-white">Face Authentication</span>
                      </div>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Available</span>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <h4 className="text-md font-medium text-white mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Account Actions
                  </h4>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="group w-full text-left p-3 bg-secondary hover:bg-yellow-accent/20 hover:text-yellow-accent active:bg-yellow-accent/20 active:text-yellow-accent rounded-lg transition-colors border border-border hover:border-yellow-accent/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Edit3 className="w-4 h-4 text-muted-foreground group-hover:text-yellow-accent" />
                          <span className="text-sm font-medium text-foreground group-hover:text-yellow-accent">Edit Profile</span>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-yellow-accent">→</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      className="group w-full text-left p-3 bg-secondary hover:bg-yellow-accent/20 hover:text-yellow-accent active:bg-yellow-accent/20 active:text-yellow-accent rounded-lg transition-colors border border-border hover:border-yellow-accent/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-muted-foreground group-hover:text-yellow-accent" />
                          <span className="text-sm font-medium text-foreground group-hover:text-yellow-accent">Change Password</span>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-yellow-accent">→</span>
                      </div>
                    </button>
                    <button className="group w-full text-left p-3 bg-secondary hover:bg-yellow-accent/20 hover:text-yellow-accent active:bg-yellow-accent/20 active:text-yellow-accent rounded-lg transition-colors border border-border hover:border-yellow-accent/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Camera className="w-4 h-4 text-muted-foreground group-hover:text-yellow-accent" />
                          <span className="text-sm font-medium text-foreground group-hover:text-yellow-accent">Setup Face Authentication</span>
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-yellow-accent">→</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
} 