import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";

export function useAuth() {
  const { isSignedIn, user } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { signOut } = useClerk();

  useEffect(() => {
    setIsAuthenticated(isSignedIn || false);
  }, [isSignedIn]);

  const logout = () => {
    signOut();
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
    getUserId,
  };
}
