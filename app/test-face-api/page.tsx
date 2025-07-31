"use client";
import { useState } from "react";

export default function TestFaceApiPage() {
  const [testResult, setTestResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const testCreateClerkUser = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("/api/auth/create-clerk-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        }),
      });

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetUserPassword = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("/api/auth/get-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
        }),
      });

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testClerkClient = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("/api/test-clerk");
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testClerkSimple = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("/api/test-clerk-simple");
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserSync = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("/api/test-sync");
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthenticateFaceUser = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("/api/auth/authenticate-face-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "ahtasham@gmail.com",
        }),
      });

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFaceAuthDebug = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("/api/test-face-auth-debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "ahtasham@gmail.com",
        }),
      });

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSetupPassword = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("/api/auth/setup-face-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "ahtasham@gmail.com",
        }),
      });

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Face API Test Page
        </h1>

        <div className="space-y-4">
          <button
            onClick={testCreateClerkUser}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Testing..." : "Test Create Clerk User"}
          </button>

          <button
            onClick={testGetUserPassword}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Testing..." : "Test Get User Password"}
          </button>

          <button
            onClick={testClerkClient}
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Testing..." : "Test Clerk Client"}
          </button>

          <button
            onClick={testClerkSimple}
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Testing..." : "Test Clerk Simple"}
          </button>

          <button
            onClick={testUserSync}
            disabled={isLoading}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Testing..." : "Test User Sync"}
          </button>

          <button
            onClick={testAuthenticateFaceUser}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Testing..." : "Test Face User Auth"}
          </button>

          <button
            onClick={testFaceAuthDebug}
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Testing..." : "Debug Face Auth"}
          </button>

          <button
            onClick={testSetupPassword}
            disabled={isLoading}
            className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Testing..." : "Test Setup Password"}
          </button>

          {testResult && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 