'use client';
import { useState } from 'react';
import { X, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import FaceAuth from './FaceAuth';
import { useAlertContext } from './AlertProvider';

interface SetupFaceAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SetupFaceAuthModal: React.FC<SetupFaceAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'capture' | 'success' | 'error'>('capture');
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useAlertContext();

  const handleFaceDetected = async (embedding: number[]) => {
    setFaceEmbedding(embedding);
    setIsLoading(true);

    console.log('Face Embeddings ', faceEmbedding ? ' + ' : ' -');

    // Call the API to set up face authentication
    await fetch('/api/auth/setup-face-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faceEmbedding: embedding }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setStep('success');
          showSuccess('Face authentication set up successfully!');
          if (onSuccess) {
            onSuccess();
          }
        }
        // } else {
        //   setError(data.error || "Failed to set up face authentication");
        //   setStep('error');
        //   showError(data.error || "Failed to set up face authentication");
        // }
      })
      .catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to set up face authentication';
        setError(errorMessage);
        setStep('error');
        showError(errorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleFaceError = (error: string) => {
    setError(error);
    setStep('error');
    showError(error);
  };

  const handleClose = () => {
    setStep('capture');
    setFaceEmbedding(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleRetry = () => {
    setStep('capture');
    setFaceEmbedding(null);
    setError(null);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-yellow-accent" />
            Setup Face Authentication
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'capture' && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Position your face in front of the camera to set up face authentication. This will
              allow you to sign in using your face in the future.
            </p>

            <FaceAuth
              mode="register"
              onFaceDetected={handleFaceDetected}
              onError={handleFaceError}
              isLoading={isLoading}
            />

            {isLoading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-accent mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Setting up face authentication...</p>
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">Success!</h3>
            <p className="text-gray-300 text-sm">
              Face authentication has been set up successfully. You can now use your face to sign
              in.
            </p>
            <button onClick={handleClose} className="btn-primary w-full">
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">Setup Failed</h3>
            <p className="text-gray-300 text-sm">
              {error || 'An error occurred while setting up face authentication.'}
            </p>
            <div className="flex gap-3">
              <button onClick={handleRetry} className="btn-primary flex-1">
                Try Again
              </button>
              <button onClick={handleClose} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupFaceAuthModal;
