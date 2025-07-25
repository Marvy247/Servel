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
    // Check authentication status and handle redirect
    const checkAuth = async () => {
      try {
        // Check if we're coming from GitHub OAuth
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const error = urlParams.get('error');
        
        if (success) {
          // Clean up URL
          window.history.replaceState({}, document.title, '/dashboard/github');
        }
        
        if (error) {
          console.error('GitHub OAuth error:', error);
          window.history.replaceState({}, document.title, '/dashboard/github');
        }

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
