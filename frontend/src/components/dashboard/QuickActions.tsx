'use client';
import { useState, useEffect, CSSProperties } from 'react';

interface Artifact {
  contractName: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  network: string;
}

const buttonStyle: CSSProperties = {
  padding: '10px 20px',
  margin: '5px',
  borderRadius: '5px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  transition: 'background-color 0.3s ease',
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ccc',
  cursor: 'not-allowed',
  color: '#666',
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#0070f3',
  color: 'white',
};

const QuickActions = () => {
  const [loading, setLoading] = useState<{ deploy: boolean; verify: boolean; test: boolean }>({
    deploy: false,
    verify: false,
    test: false,
  });

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      const response = await fetch('/api/dashboard/quick-actions/artifacts');
      const data = await response.json();
      if (data.success) {
        setArtifacts(data.artifacts);
        // Set default selected artifact to first in list if none selected
        if (data.artifacts.length > 0 && !selectedArtifact) {
          setSelectedArtifact(data.artifacts[0]);
        }
      } else {
        console.error('Failed to load artifacts:', data.message);
        setSelectedArtifact(null);
      }
    } catch (error) {
      console.error('Error fetching artifacts:', error);
      setSelectedArtifact(null);
    }
  };

  const handleRefreshArtifacts = () => {
    fetchArtifacts();
  };

  const handleDeploy = async () => {
    if (!selectedArtifact) {
      alert('Please select an artifact before deploying.');
      return;
    }
    setLoading(prev => ({ ...prev, deploy: true }));
    try {
      const response = await fetch('/api/dashboard/quick-actions/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact: selectedArtifact }),
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Deploy action failed', error);
    } finally {
      setLoading(prev => ({ ...prev, deploy: false }));
    }
  };

  const handleVerify = async () => {
    if (!selectedArtifact) {
      alert('Please select an artifact before verifying.');
      return;
    }
    setLoading(prev => ({ ...prev, verify: true }));
    try {
      const contractAddress = prompt('Enter the deployed contract address to verify:');
      if (!contractAddress) {
        alert('Contract address is required for verification.');
        setLoading(prev => ({ ...prev, verify: false }));
        return;
      }
      const response = await fetch('/api/quickActions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress, artifact: selectedArtifact }),
      });
      const data = await response.json();
      console.log(data.message);
      if (data.success) {
        alert('Contract was successfully verified.');
      } else {
        alert('Contract verification failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Verify action failed', error);
      alert('Verify action failed. See console for details.');
    } finally {
      setLoading(prev => ({ ...prev, verify: false }));
    }
  };

  const handleRunTests = async () => {
    setLoading(prev => ({ ...prev, test: true }));
    try {
      const response = await fetch('/api/quickActions/run-tests', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert('Tests ran successfully:\n' + data.output);
      } else {
        alert('Test run failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Run tests action failed', error);
      alert('Run tests action failed. See console for details.');
    } finally {
      setLoading(prev => ({ ...prev, test: false }));
    }
  };

  return (
    <div>
      <select
        value={selectedArtifact?.contractName || ''}
        onChange={e => {
          const artifact = artifacts.find(a => a.contractName === e.target.value) || null;
          setSelectedArtifact(artifact);
        }}
        style={{ padding: '8px', margin: '5px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
      >
        <option value="" disabled>
          Select an artifact
        </option>
        {artifacts.length === 0 && (
          <option disabled>No artifacts available</option>
        )}
        {artifacts.map(artifact => (
          <option key={artifact.contractName} value={artifact.contractName}>
            {artifact.contractName}
          </option>
        ))}
      </select>
      <button
        onClick={handleDeploy}
        disabled={loading.deploy || !selectedArtifact}
        style={loading.deploy || !selectedArtifact ? disabledButtonStyle : primaryButtonStyle}
        title={loading.deploy || !selectedArtifact ? 'Select an artifact to enable deploy' : 'Deploy selected contract'}
      >
        {loading.deploy ? 'Deploying...' : 'Deploy Contract'}
      </button>
      <button
        onClick={handleRefreshArtifacts}
        style={{ marginLeft: '10px', ...primaryButtonStyle }}
      >
        Refresh Artifacts
      </button>
      <button
        onClick={handleVerify}
        disabled={loading.verify}
        style={loading.verify ? disabledButtonStyle : primaryButtonStyle}
      >
        {loading.verify ? 'Verifying...' : 'Verify Contract'}
      </button>
      <button
        onClick={handleRunTests}
        disabled={loading.test}
        style={loading.test ? disabledButtonStyle : primaryButtonStyle}
      >
        {loading.test ? 'Running...' : 'Run Tests'}
      </button>
    </div>
  );
};

export default QuickActions;
