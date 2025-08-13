'use client';

import { useAlertContext } from '@/components/AlertProvider';

export default function TestAlertsPage() {
  const { showSuccess, showError, showWarning, showInfo } = useAlertContext();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Alert System Test</h1>

        <div className="space-y-4">
          <button
            onClick={() => showSuccess('This is a success message!')}
            className="w-full p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Show Success Alert
          </button>

          <button
            onClick={() => showError('This is an error message!')}
            className="w-full p-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Show Error Alert
          </button>

          <button
            onClick={() => showWarning('This is a warning message!')}
            className="w-full p-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
          >
            Show Warning Alert
          </button>

          <button
            onClick={() => showInfo('This is an info message!')}
            className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Show Info Alert
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Alert System Features:</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ Dismissible alerts at top center</li>
            <li>✅ Auto-dismiss after 4 seconds</li>
            <li>✅ Manual dismiss with X button</li>
            <li>✅ Smooth fade in/out animations</li>
            <li>✅ Different colors for different alert types</li>
            <li>✅ Icons for each alert type</li>
            <li>✅ Backdrop blur effect</li>
            <li>✅ Responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
