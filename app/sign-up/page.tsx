'use client';
import { useSignUp, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAlertContext } from '@/components/AlertProvider';

export default function SignUpPage() {
  const { signUp, isLoaded } = useSignUp();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useAlertContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  console.log('User from Sign-up Page --> ', isSignedIn);

  if (isSignedIn) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!signUp) {
        throw new Error('Sign up not available');
      }

      // Create the signup with just email and password
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification();

      setShowVerification(true);
      showSuccess('Verification code sent to your email!');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!signUp) {
        throw new Error('Sign up not available');
      }

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        // Now create the user in our database
        const registerResponse = await fetch('/api/auth/register-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
          }),
        });

        if (!registerResponse.ok) {
          const errorData = await registerResponse.json();
          showError(errorData.error || 'Failed to register user');
          return;
        }

        showSuccess('Account created successfully! Redirecting to dashboard...');

        // Redirect to dashboard after successful verification
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        showError('Verification failed. Please check your code and try again.');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Verification failed. Please try again.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      if (!signUp) {
        throw new Error('Sign up not available');
      }
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Google sign up failed. Please try again.';
      showError(errorMessage);
    }
  };

  const handleFacebookSignUp = async () => {
    try {
      if (!signUp) {
        throw new Error('Sign up not available');
      }
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_facebook',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Facebook sign up failed. Please try again.';
      showError(errorMessage);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black p-4 sm:p-6">
      <div className="card-dark p-4 sm:p-6 w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-white">
          Create Your Account
        </h1>

        {/* Social Login Buttons */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="flex gap-3 sm:gap-4">
            {/* Google */}
            <button
              onClick={handleGoogleSignUp}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 border border-border rounded-md shadow-sm bg-muted hover:bg-yellow-accent hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-accent transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookSignUp}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 border border-border rounded-md shadow-sm bg-muted hover:bg-yellow-accent hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-accent transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            {/* Face Recognition */}
            <a
              href="/face-sign-up"
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 border border-border rounded-md shadow-sm bg-muted hover:bg-yellow-accent hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-accent transition-colors"
              aria-label="Sign up with face recognition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 sm:w-5 sm:h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 11a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" />
                <path
                  fillRule="evenodd"
                  d="M2 4a2 2 0 012-2h2a1 1 0 010 2H4v2a1 1 0 01-2 0V4zm18-2a2 2 0 012 2v2a1 1 0 01-2 0V4h-2a1 1 0 110-2h2zM4 20a2 2 0 01-2-2v-2a1 1 0 112 0v2h2a1 1 0 110 2H4zm16 0a2 2 0 002-2v-2a1 1 0 10-2 0v2h-2a1 1 0 100 2h2zM8 15a4 4 0 018 0H8z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-4 sm:mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {!showVerification ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-yellow-accent focus:border-transparent text-sm sm:text-base"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-yellow-accent focus:border-transparent text-sm sm:text-base"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-yellow-accent focus:border-transparent text-sm sm:text-base"
                  placeholder="john@example.com"
                />
              </div>
              {/* <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-yellow-accent focus:border-transparent text-sm sm:text-base"
                  placeholder="••••••••"
                />
              </div> */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pr-10 px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-yellow-accent focus:border-transparent text-sm sm:text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-yellow-accent hover:text-yellow-500 text-xl"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-accent text-black font-semibold py-2 sm:py-3 px-4 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </>
        ) : (
          <>
            <form onSubmit={handleVerification} className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-yellow-accent focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter the code sent to your email"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-accent text-black font-semibold py-2 sm:py-3 px-4 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          </>
        )}

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <a
              href="/sign-in"
              className="text-yellow-accent hover:text-yellow-500 font-medium transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
