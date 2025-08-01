"use client";
import { useUser } from "@clerk/nextjs";

export default function TestAuthPage() {
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Is Loaded:</strong> {isLoaded ? "Yes" : "No"}
        </div>
        <div>
          <strong>Is Signed In:</strong> {isSignedIn ? "Yes" : "No"}
        </div>
        <div>
          <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : "No user"}
        </div>
      </div>
      
      <div className="mt-8">
        <a href="/face-sign-in" className="text-blue-600 hover:text-blue-800">
          Go to Face Sign In
        </a>
      </div>
      
      <div className="mt-4">
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
} 