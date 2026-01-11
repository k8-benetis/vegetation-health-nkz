import { useState, useEffect } from 'react';

interface AuthContext {
  token?: string;
  isAuthenticated: boolean;
  user?: any;
  login?: () => void;
  logout?: () => void;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthContext>({
    isAuthenticated: false
  });

  useEffect(() => {
    // Check for host auth context
    const checkAuth = () => {
      // @ts-ignore
      const hostAuth = window.__nekazariAuthContext;
      
      if (hostAuth) {
        setAuth({
          isAuthenticated: hostAuth.isAuthenticated,
          token: hostAuth.token,
          user: hostAuth.user,
          login: hostAuth.login,
          logout: hostAuth.logout
        });
      }
    };

    checkAuth();

    // Listen for auth events if needed, but polling or interval might be safer for now
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  return auth;
}
