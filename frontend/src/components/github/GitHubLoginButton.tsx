'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GitHubLoginButtonProps {
  onLoginSuccess?: (user: any) => void;
  className?: string;
}

export function GitHubLoginButton({ onLoginSuccess, className }: GitHubLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      // Redirect to GitHub OAuth flow
      window.location.href = 'http://localhost:3001/api/github/auth';
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect to GitHub',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGitHubLogin}
      disabled={loading}
      className={`flex items-center gap-2 ${className}`}
      variant="outline"
    >
      <Github className="h-4 w-4" />
      {loading ? 'Connecting...' : 'Connect with GitHub'}
    </Button>
  );
}
