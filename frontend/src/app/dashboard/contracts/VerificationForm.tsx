import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiChevronDown, FiUpload } from 'react-icons/fi';
import { FaEthereum } from 'react-icons/fa';

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`/api/dashboard/contracts?projectId=${projectId}`);
        const data = await response.json();

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      // Handle verification submission logic here
      // Example: await verifyContract(selectedAddress);
      alert(`Verifying contract at address: ${selectedAddress}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-center">
          <FiAlertCircle className="text-red-500 mr-2" />
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaEthereum className="text-blue-500 text-xl" />
        <h2 className="text-lg font-semibold text-gray-900">Contract Verification</h2>
      </div>
      
      <p className="text-sm text-gray-500">
        Verify your smart contracts to enable source code verification on block explorers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="contractAddress" className="block text-sm font-medium text-gray-700">
            Contract Address
          </label>
          <div className="relative">
            <select
              id="contractAddress"
              value={selectedAddress}
              onChange={handleAddressChange}
              required
              className="appearance-none block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={Object.keys(contracts).length === 0}
            >
              <option value="" disabled>Select a contract address</option>
              {Object.entries(contracts).map(([network, contractsList]) =>
                Array.isArray(contractsList) ? contractsList.map((contract) => (
                  <option key={contract.address} value={contract.address}>
                    {contract.name} ({network}) - {contract.address.substring(0, 6)}...{contract.address.substring(38)}
                  </option>
                )) : null
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <FiChevronDown className="text-gray-400" />
            </div>
          </div>
          {Object.keys(contracts).length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No contracts available for verification</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="compiler-version"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="compiler-version" className="ml-2 block text-sm text-gray-700">
              Match exact compiler version
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Contract Metadata (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>Upload metadata file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  JSON files up to 10MB
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedAddress || isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !selectedAddress || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <FiCheckCircle className="-ml-1 mr-2 h-4 w-4" />
                Verify Contract
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm;