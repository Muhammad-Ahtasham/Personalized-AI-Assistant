import React, { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useAlertContext } from "@/components/AlertProvider";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useAlertContext();
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;
  if (!isLoaded) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signIn?.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setStep(2);
      showSuccess('Verification code sent to your email!');
    } catch {
      setError('Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });
      if (result?.status === 'complete') {
        setActive?.({ session: result.createdSessionId });
        showSuccess('Password reset successfully! You are now signed in.');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        showError('Failed to reset password. Please try again.');
      }
    } catch {
      showError('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-dark border border-border rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Forgot Password</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">✕</button>
        </div>
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-accent"
                placeholder="Enter your registered email"
                required
              />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {success && <div className="text-green-400 text-sm">{success}</div>}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-white hover:bg-muted transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-yellow-accent text-black rounded-lg hover:bg-yellow-400 transition-colors"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-accent"
                placeholder="Enter the code sent to your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-accent"
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-accent"
                placeholder="Confirm new password"
                required
              />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {success && <div className="text-green-400 text-sm">{success}</div>}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-white hover:bg-muted transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-yellow-accent text-black rounded-lg hover:bg-yellow-400 transition-colors"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal; 