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
      // In a real implementation, this would initiate OAuth flow
      const response = await fetch('/api/github/auth');
      const data = await response.json();
      
      if (data.success) {
        // Open OAuth popup
        const popup = window.open(
          data.url,
          'GitHub OAuth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        // Listen for OAuth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GITHUB_OAUTH_SUCCESS') {
            popup?.close();
            window.removeEventListener('message', handleMessage);
            
            toast({
              title: 'Success',
              description: 'Successfully connected to GitHub',
            });
            
            onLoginSuccess?.(event.data.user);
          }
        };
        
        window.addEventListener('message', handleMessage);
      } else {
        throw new Error(data.error || 'Failed to initiate GitHub login');
      }
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
