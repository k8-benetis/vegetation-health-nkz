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
        if (hostAuth.token !== auth.token) {
           console.log('[Module:Auth] 🔄 Token Update Detected!', { 
             prevLength: auth.token?.length, 
             newLength: hostAuth.token?.length,
             user: hostAuth.user?.username 
           });
           
           setAuth({
            isAuthenticated: hostAuth.isAuthenticated,
            token: hostAuth.token,
            user: hostAuth.user,
            login: hostAuth.login,
            logout: hostAuth.logout
          });
        }
      } else {
         if (Math.random() > 0.95) console.warn('[Module:Auth] ⚠️ Waiting for Window Context...');
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, [auth.token]);

  return auth;
}
