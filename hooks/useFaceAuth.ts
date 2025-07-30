import { useState, useEffect } from 'react';

export function useFaceAuth() {
  const [faceAuthSession, setFaceAuthSession] = useState<string | null>(null);
  const [isFaceAuthenticated, setIsFaceAuthenticated] = useState(false);

  useEffect(() => {
    // Check for face authentication session
    const checkFaceAuth = () => {
      const cookies = document.cookie.split(';');
      const faceAuthCookie = cookies.find(cookie => cookie.trim().startsWith('face_auth_session='));
      if (faceAuthCookie) {
        const sessionToken = faceAuthCookie.split('=')[1];
        setFaceAuthSession(sessionToken);
        setIsFaceAuthenticated(true);
        return true;
      }
      return false;
    };

    checkFaceAuth();
  }, []);

  const logout = () => {
    document.cookie = 'face_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setFaceAuthSession(null);
    setIsFaceAuthenticated(false);
    window.location.href = '/sign-in';
  };

  return {
    faceAuthSession,
    isFaceAuthenticated,
    logout
  };
} 