import { useState, useEffect } from 'react';
import { Deployment } from '../../types/github';

export const useDeployments = (repo: string) => {
  const [deployments, setDeployments] = useState<Deployment[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data for development
        const mockDeployments: Deployment[] = [
          {
            id: 1,
            environment: 'production',
            status: 'active',
            created_at: new Date().toISOString(),
            sha: 'a1b2c3d4e5f6g7h8i9j0',
            description: 'Latest production deployment'
          },
          {
            id: 2,
            environment: 'staging',
            status: 'pending',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            sha: 'b2c3d4e5f6g7h8i9j0a1',
            description: 'Feature testing deployment'
          },
          {
            id: 3,
            environment: 'development',
            status: 'error',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            sha: 'c3d4e5f6g7h8i9j0a1b2'
          }
        ];
        
        setDeployments(mockDeployments);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch deployments');
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [repo]);

  return { deployments, loading, error };
};
