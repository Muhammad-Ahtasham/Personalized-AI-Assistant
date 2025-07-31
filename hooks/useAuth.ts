import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function useAuth() {
  const { isSignedIn, user } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(isSignedIn || false);
  }, [isSignedIn]);

  const logout = () => {
    // Clerk will handle its own logout
    window.location.href = '/sign-in';
  };

  const getUserId = () => {
    if (isSignedIn && user) {
      return user.id;
    }
    return null;
  };

  return {
    isAuthenticated,
    isSignedIn,
    user,
    logout,
    getUserId
  };
} 