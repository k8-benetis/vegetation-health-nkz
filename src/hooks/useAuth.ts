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
    const checkAuth = () => {
      // @ts-ignore
      const hostAuth = window.__nekazariAuthContext;
      
      if (hostAuth) {
        // Only log on state change to avoid spam
        if (hostAuth.token !== auth.token) {
           console.log('[Module:Vegetation] ✅ Auth Context Sync:', { 
             hasToken: !!hostAuth.token, 
             user: hostAuth.user?.username 
           });
        }
        
        setAuth({
          isAuthenticated: hostAuth.isAuthenticated,
          token: hostAuth.token,
          user: hostAuth.user,
          login: hostAuth.login,
          logout: hostAuth.logout
        });
      } else {
         // Log occasionally
         if (Math.random() > 0.95) console.warn('[Module:Vegetation] ⚠️ Waiting for AuthContext...');
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, [auth.token]);

  return auth;
}
