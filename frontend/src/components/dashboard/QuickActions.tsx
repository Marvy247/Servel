'use client';
import { useState } from 'react';

const QuickActions = () => {
  const [loading, setLoading] = useState<{ deploy: boolean; verify: boolean; test: boolean }>({
    deploy: false,
    verify: false,
    test: false,
  });

  const handleDeploy = async () => {
    setLoading(prev => ({ ...prev, deploy: true }));
    try {
      const response = await fetch('/api/dashboard/quick-actions/deploy', { method: 'POST' });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Deploy action failed', error);
    } finally {
      setLoading(prev => ({ ...prev, deploy: false }));
    }
  };
  const handleVerify = async () => {
    setLoading(prev => ({ ...prev, verify: true }));
    try {
      const response = await fetch('/api/dashboard/quick-actions/verify', { method: 'POST' });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Verify action failed', error);
    } finally {
      setLoading(prev => ({ ...prev, verify: false }));
    }
  };

  const handleRunTests = () => {
    console.log('Run tests action triggered');
    // Placeholder for test runner functionality
  };

  return (
    <div>
      <button onClick={handleDeploy} disabled={loading.deploy}>
        {loading.deploy ? 'Deploying...' : 'Deploy Contract'}
      </button>
      <button onClick={handleVerify} disabled={loading.verify}>
        {loading.verify ? 'Verifying...' : 'Verify Contract'}
      </button>
      <button onClick={handleRunTests} disabled={loading.test}>
        {loading.test ? 'Running...' : 'Run Tests'}
      </button>
    </div>
  );
};

export default QuickActions;
