import React, { useEffect, useState } from 'react';

interface Contract {
  name: string;
  address: string;
  network: string;
  verified: boolean;
  lastDeployed: string;
}

interface ContractsByNetwork {
  [network: string]: Contract[];
}

interface VerificationFormProps {
  projectId: string;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ projectId }) => {
  const [contracts, setContracts] = useState<ContractsByNetwork>({});
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`/api/dashboard/contracts?projectId=${projectId}`);
        const data = await response.json();

        // data is Record<string, Contract[]>
        setContracts(data);

        // Pre-fill with the first address found if any
        const firstNetwork = Object.keys(data)[0];
        if (firstNetwork && data[firstNetwork].length > 0) {
          setSelectedAddress(data[firstNetwork][0].address);
        }
      } catch (err) {
        setError('Failed to load deployed contract addresses.');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
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
        {Object.entries(contracts).map(([network, contractsList]) =>
          Array.isArray(contractsList) ? contractsList.map((contract) => (
            <option key={contract.address} value={contract.address}>
              {network} - {contract.address}
            </option>
          )) : null
        )}
      </select>
      <button type="submit">Verify Contract</button>
    </form>
  );
};

export default VerificationForm;
