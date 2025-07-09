'use client';
import { useState, useEffect } from 'react';
import { Rocket, RefreshCw, ShieldCheck, TestTube2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

interface Artifact {
  contractName: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  network: string;
}

const QuickActions = () => {
  const [loading, setLoading] = useState({
    deploy: false,
    verify: false,
    test: false,
    refresh: false
  });

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    setLoading(prev => ({ ...prev, refresh: true }));
    try {
      const response = await fetch('/api/dashboard/quick-actions/artifacts');
      const data = await response.json();
      if (data.success) {
        setArtifacts(data.artifacts);
        if (data.artifacts.length > 0 && !selectedArtifact) {
          setSelectedArtifact(data.artifacts[0]);
        }
        toast.success('Artifacts refreshed successfully');
      } else {
        toast.error('Failed to load artifacts: ' + data.message);
      }
    } catch (error) {
      toast.error('Error fetching artifacts');
      console.error('Fetch artifacts error:', error);
    } finally {
      setLoading(prev => ({ ...prev, refresh: false }));
    }
  };

  const handleDeploy = async () => {
    if (!selectedArtifact) {
      toast.error('Please select an artifact before deploying');
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
      
      if (data.success) {
        toast.success('Contract deployed successfully!', {
          description: `Transaction hash: ${data.txHash}`,
          action: {
            label: 'View on Explorer',
            onClick: () => window.open(`https://etherscan.io/tx/${data.txHash}`, '_blank')
          }
        });
      } else {
        toast.error('Deployment failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      toast.error('Deployment failed. See console for details.');
      console.error('Deployment error:', error);
    } finally {
      setLoading(prev => ({ ...prev, deploy: false }));
    }
  };

  const handleVerify = async () => {
    if (!selectedArtifact) {
      toast.error('Please select an artifact before verifying');
      return;
    }
    
    setLoading(prev => ({ ...prev, verify: true }));
    try {
      const contractAddress = prompt('Enter the deployed contract address to verify:');
      if (!contractAddress) {
        toast.error('Contract address is required for verification');
        return;
      }

      const response = await fetch('/api/quickActions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress, artifact: selectedArtifact }),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Contract verified successfully!', {
          action: {
            label: 'View on Explorer',
            onClick: () => window.open(`https://etherscan.io/address/${contractAddress}#code`, '_blank')
          }
        });
      } else {
        toast.error('Verification failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      toast.error('Verification failed. See console for details.');
      console.error('Verification error:', error);
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
        toast.success('Tests completed successfully!', {
          description: `${data.passed} passed, ${data.failed} failed`
        });
      } else {
        toast.error('Test run failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      toast.error('Test run failed. See console for details.');
      console.error('Test run error:', error);
    } finally {
      setLoading(prev => ({ ...prev, test: false }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
      
      <div className="flex flex-col space-y-4">
        {/* Artifact Selection */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            {selectedArtifact?.contractName || 'Select an artifact'}
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
              {artifacts.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">No artifacts available</div>
              ) : (
                artifacts.map(artifact => (
                  <button
                    key={artifact.contractName}
                    onClick={() => {
                      setSelectedArtifact(artifact);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedArtifact?.contractName === artifact.contractName 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700'
                    }`}
                  >
                    {artifact.contractName}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDeploy}
            disabled={loading.deploy || !selectedArtifact}
            variant="default"
            className="w-full flex items-center justify-center gap-2"
          >
            {loading.deploy ? 'Deploying...' : 'Deploy'}
            <Rocket className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleVerify}
            disabled={loading.verify || !selectedArtifact}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
          >
            {loading.verify ? 'Verifying...' : 'Verify'}
            <ShieldCheck className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleRunTests}
            disabled={loading.test}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
          >
            {loading.test ? 'Running...' : 'Run Tests'}
            <TestTube2 className="w-4 h-4" />
          </Button>

          <Button
            onClick={fetchArtifacts}
            disabled={loading.refresh}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2"
          >
            Refresh
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;