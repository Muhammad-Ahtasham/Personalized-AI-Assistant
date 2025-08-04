"use client";
import { useUser } from "@clerk/nextjs";

export default function TestAuthPage() {
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4 text-white">Authentication Test Page</h1>
      
      <div className="space-y-4">
        <div className="card-dark p-4">
          <strong className="text-yellow-accent">Is Loaded:</strong> <span className="text-white">{isLoaded ? "Yes" : "No"}</span>
        </div>
        <div className="card-dark p-4">
          <strong className="text-yellow-accent">Is Signed In:</strong> <span className="text-white">{isSignedIn ? "Yes" : "No"}</span>
        </div>
        <div className="card-dark p-4">
          <strong className="text-yellow-accent">User:</strong> <pre className="text-white text-sm mt-2 overflow-auto">{user ? JSON.stringify(user, null, 2) : "No user"}</pre>
        </div>
      </div>
      
      <div className="mt-8">
        <a href="/face-sign-in" className="text-yellow-accent hover:text-yellow-500 font-medium">
          Go to Face Sign In
        </a>
      </div>
      
      <div className="mt-4">
        <a href="/dashboard" className="text-yellow-accent hover:text-yellow-500 font-medium">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
} 