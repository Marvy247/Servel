import { useState, useEffect } from 'react';

interface GitHubAuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    login: string;
    name: string;
    email: string;
    avatar_url: string;
  } | null;
  loading: boolean;
}

export const useGitHubAuth = () => {
  const [auth, setAuth] = useState<GitHubAuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/github/auth/status');
        const data = await response.json();
        
        setAuth({
          isAuthenticated: data.authenticated,
          user: data.user || null,
          loading: false
        });
      } catch (error) {
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    // Redirect to GitHub OAuth
    window.location.href = 'http://localhost:3001/api/github/auth';
  };

  const logout = async () => {
    await fetch('/api/github/logout', { method: 'POST' });
    setAuth({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };

  return {
    ...auth,
    login,
    logout
  };
};
