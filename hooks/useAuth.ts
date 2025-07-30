import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function useAuth() {
  const { isSignedIn, user } = useUser();
  const [faceAuthSession, setFaceAuthSession] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [faceUser, setFaceUser] = useState<any>(null);

  useEffect(() => {
    // Check for face authentication session
    const checkFaceAuth = () => {
      const cookies = document.cookie.split(';');
      const faceAuthCookie = cookies.find(cookie => cookie.trim().startsWith('face_auth_session='));
      if (faceAuthCookie) {
        const sessionToken = faceAuthCookie.split('=')[1];
        setFaceAuthSession(sessionToken);
        
        // Extract user info from session token
        const sessionParts = sessionToken.split('_');
        if (sessionParts.length >= 3) {
          const userId = sessionParts[2];
          const timestamp = sessionParts[1];
          
          // Create a mock user object for face authentication
          setFaceUser({
            id: userId,
            emailAddresses: [{ emailAddress: `user-${userId}@face-auth.com` }],
            firstName: 'Face',
            lastName: 'User',
            imageUrl: null,
            createdAt: new Date().toISOString() // Use current date instead of parsing timestamp
          });
        }
        return true;
      }
      return false;
    };

    const hasFaceAuth = checkFaceAuth();
    setIsAuthenticated(isSignedIn || hasFaceAuth);
  }, [isSignedIn]);

  const logout = () => {
    // Clear face auth session if it exists
    if (faceAuthSession) {
      document.cookie = 'face_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setFaceAuthSession(null);
      setFaceUser(null);
    }
    // Clerk will handle its own logout
    window.location.href = '/sign-in';
  };

  const getUserId = () => {
    if (isSignedIn && user) {
      return user.id;
    }
    if (faceAuthSession) {
      // Extract userId from session token: face_auth_TIMESTAMP_USERID
      const sessionParts = faceAuthSession.split('_');
      if (sessionParts.length >= 3) {
        return sessionParts[2];
      }
    }
    return null;
  };

  // Return the appropriate user object
  const currentUser = isSignedIn ? user : faceUser;

  return {
    isAuthenticated,
    isSignedIn,
    isFaceAuthenticated: !!faceAuthSession,
    user: currentUser,
    faceAuthSession,
    logout,
    getUserId
  };
} 