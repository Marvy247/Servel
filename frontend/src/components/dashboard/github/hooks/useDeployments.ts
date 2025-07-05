import { useState, useEffect } from 'react';
import { Deployment } from '../../types/github';

export const useDeployments = (repo: string) => {
  const [deployments, setDeployments] = useState<Deployment[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const response = await fetch("/api/github/deployments?repo=" + encodeURIComponent(repo));
        if (!response.ok) {
          throw new Error("Failed to fetch deployments");
        }
        const data = await response.json();
        setDeployments(data.deployments || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch deployments");
        setLoading(false);
      }
    };

    if (repo) {
      fetchDeployments();
    } else {
      setDeployments([]);
      setLoading(false);
    }
  }, [repo]);

  return { deployments, loading, error };
};
