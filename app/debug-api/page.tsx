'use client';

import { useState } from 'react';

export default function DebugAPI() {
  const [results, setResults] = useState<
    Array<{
      endpoint: string;
      method: string;
      status?: number;
      data?: unknown;
      error?: string;
      timestamp: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: unknown) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { rawResponse: text };
      }

      setResults((prev) => [
        ...prev,
        {
          endpoint,
          method,
          status: response.status,
          data,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setResults((prev) => [
        ...prev,
        {
          endpoint,
          method,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Debug Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => testEndpoint('health')}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Health Endpoint
        </button>

        <button
          onClick={() => testEndpoint('test-deploy')}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Deploy Endpoint
        </button>

        <button
          onClick={() => testEndpoint('test-quiz', 'POST', { topic: 'JavaScript' })}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Quiz Endpoint (No Auth)
        </button>

        <button
          onClick={() => testEndpoint('generate-quiz', 'POST', { topic: 'JavaScript' })}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Test Generate Quiz (With Auth)
        </button>

        <button
          onClick={() => testEndpoint('generate-plan', 'POST', { topic: 'JavaScript' })}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          Test Generate Plan (With Auth)
        </button>

        <button
          onClick={clearResults}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Testing endpoint...</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">
                {result.method} /api/{result.endpoint}
              </h3>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  (result.status ?? 0) >= 200 && (result.status ?? 0) < 300
                    ? 'bg-red-100 text-green-800'
                    : (result.status ?? 0) >= 400
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {result.status || 'Error'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{result.timestamp}</p>
            {result.error ? (
              <div className="bg-red-100 p-3 rounded">
                <p className="text-red-800 font-mono text-sm">{result.error}</p>
              </div>
            ) : (
              <pre className="bg-white text-black p-3 rounded border text-sm overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
