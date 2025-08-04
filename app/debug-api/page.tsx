"use client";

import { useState } from "react";

export default function DebugAPIPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint: string, method: string = "GET", body?: any) => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = { error: "Not JSON", text };
      }

      setResults(prev => [...prev, {
        endpoint,
        method,
        status: response.status,
        data,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        endpoint,
        method,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-accent mb-6">API Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => testAPI("/api/health")}
            disabled={loading}
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            Test Health API
          </button>
          
          <button
            onClick={() => testAPI("/api/test-simple")}
            disabled={loading}
            className="p-3 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
          >
            Test Simple API
          </button>
          
          <button
            onClick={() => testAPI("/api/test-profile-api")}
            disabled={loading}
            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
          >
            Test Profile API
          </button>
          
          <button
            onClick={() => testAPI("/api/auth/update-user-profile", "PUT", { firstName: "Test" })}
            disabled={loading}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
          >
            Test Update Profile API
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Results</h2>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Clear Results
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-card-dark border border-border rounded-lg p-4">
              <div className="flex items-center gap-4 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status >= 200 && result.status < 300 
                    ? 'bg-green-600' 
                    : result.status >= 400 
                    ? 'bg-red-600' 
                    : 'bg-yellow-600'
                }`}>
                  {result.status || 'Error'}
                </span>
                <span className="text-sm font-mono">{result.method}</span>
                <span className="text-sm font-mono text-yellow-accent">{result.endpoint}</span>
                <span className="text-xs text-muted-foreground">{result.timestamp}</span>
              </div>
              
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-card-dark p-6 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-accent mx-auto mb-4"></div>
              <p className="text-center">Testing API...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 