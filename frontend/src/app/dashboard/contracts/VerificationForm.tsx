import React, { useEffect, useState } from 'react';

interface DeploymentArtifact {
  address: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  network: string;
}

interface DeploymentsByNetwork {
  [network: string]: DeploymentArtifact[];
}

interface VerificationFormProps {
  projectId: string;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ projectId }) => {
  const [deployments, setDeployments] = useState<DeploymentsByNetwork>({});
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/deployment/${projectId}/addresses`);
        const data = await response.json();
        if (data.success) {
          setDeployments(data.data);
          // Pre-fill with the first address found if any
          const firstNetwork = Object.keys(data.data)[0];
          if (firstNetwork && data.data[firstNetwork].length > 0) {
            setSelectedAddress(data.data[firstNetwork][0].address);
          }
        } else {
          setError('Failed to load deployed contract addresses.');
        }
      } catch (err) {
        setError('Error fetching deployed contract addresses.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [projectId]);

  const handleAddressChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAddress(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle verification submission logic here
    alert(`Verifying contract at address: ${selectedAddress}`);
  };

  if (loading) {
    return <div>Loading deployed contract addresses...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="contractAddress">Select Contract Address to Verify:</label>
      <select
        id="contractAddress"
        value={selectedAddress}
        onChange={handleAddressChange}
        required
      >
        {Object.entries(deployments).map(([network, artifacts]) =>
          artifacts.map((artifact) => (
            <option key={artifact.address} value={artifact.address}>
              {network} - {artifact.address}
            </option>
          ))
        )}
      </select>
      <button type="submit">Verify Contract</button>
    </form>
  );
};

export default VerificationForm;
