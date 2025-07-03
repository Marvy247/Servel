'use client'

import { useState, useEffect } from 'react';
import { parseRevertReason } from '../../utils/errorParser';
import { validateInput, formatValue } from '../../utils/inputValidator';
import { useWeb3 } from '../../providers/web3';
import { Contract, InterfaceAbi, JsonFragment } from 'ethers';
import { StatusBadge } from './StatusBadge';

export default function ContractInteraction() {
  const { provider } = useWeb3();
  const [contractAddress, setContractAddress] = useState('');
  const [abi, setAbi] = useState<JsonFragment[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<
    (JsonFragment & {
      name: string;
      type: 'function';
      inputs?: Array<{name: string; type: string}>;
      stateMutability?: string;
    }) | null
  >(null);
  const [functionArgs, setFunctionArgs] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [gasUsed, setGasUsed] = useState<number | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmations, setConfirmations] = useState<number>(0);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Array<{
    address: string
    name: string
    abi: JsonFragment[] | string
  }>>([]);

  useEffect(() => {
    const loadVerifiedContracts = async () => {
      try {
        // First try loading from backend API
        const response = await fetch('/api/verified-contracts');
        if (response.ok) {
          const data = await response.json();
          setContracts(data);
          localStorage.setItem('savedContracts', JSON.stringify(data));
        } else {
          // Fallback to localStorage
          const savedContracts = JSON.parse(localStorage.getItem('savedContracts') || '[]');
          setContracts(savedContracts);
        }
      } catch (error) {
        console.error('Failed to load verified contracts:', error);
        // Fallback to localStorage
        const savedContracts = JSON.parse(localStorage.getItem('savedContracts') || '[]');
        setContracts(savedContracts);
      }
    };

    loadVerifiedContracts();
  }, []);

  const handleContractSelect = async (address: string) => {
    setContractAddress(address);
    const contract = contracts.find(c => c.address === address);
    if (contract) {
      try {
        const parsedAbi = typeof contract.abi === 'string' 
          ? JSON.parse(contract.abi) 
          : contract.abi;
        if (!Array.isArray(parsedAbi)) {
          throw new Error('ABI must be an array');
        }
        setAbi(parsedAbi);
      } catch (error) {
        console.error('Invalid ABI format:', error);
        setErrorMessage('Invalid contract ABI format');
      }
    } else {
      try {
        // Fetch ABI from backend if not loaded
        const response = await fetch(`/api/contract-abi/${address}`);
        if (response.ok) {
          const abi = await response.json();
          setAbi(abi);
          // Update contracts list with ABI
          setContracts(prev => prev.map(c => 
            c.address === address ? {...c, abi} : c
          ));
        }
      } catch (error) {
        console.error('Failed to fetch ABI:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !contractAddress || !selectedFunction) return;

    // Validate all inputs before proceeding
    if (!validateAndFormatInputs()) {
      setErrorMessage('Please fix input validation errors before submitting');
      return;
    }

    setTxStatus('pending');
    setResult(null);
    setGasUsed(null);
    setEstimatedGas(null);
    setErrorMessage('');
    setConfirmations(0);
    setTxHash(null);

    // Estimate gas first
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, abi, provider);
      const estimatedGas = await (contract.connect(signer) as any).estimateGas[selectedFunction.name](
        ...Object.values(functionArgs)
      );
      setEstimatedGas(Number(estimatedGas));
    } catch (error) {
      console.error('Gas estimation failed:', error);
    }

    try {
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, abi, provider);
      
      if (selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure') {
        // Read function
        const result = await (contract as any)[selectedFunction.name](...Object.values(functionArgs));
        setResult(result);
        setTxStatus('success');
      } else {
        // Write function
        const tx = await (contract.connect(signer) as any)[selectedFunction.name](...Object.values(functionArgs));
        setTxHash(tx.hash);
        
        // Track confirmations
        tx.wait()
          .then((receipt: any) => {
            setGasUsed(Number(receipt.gasUsed));
            setTxStatus('success');
            setResult(receipt);
          })
          .catch((error: any) => {
            setTxStatus('error');
            const revertReason = parseRevertReason(error);
            setErrorMessage(revertReason || 'Transaction failed');
          });
      }
    } catch (error) {
      setTxStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };


  const validateAndFormatInputs = (): boolean => {
    if (!selectedFunction?.inputs) return true;

    const newErrors: Record<string, string> = {};
    const formattedArgs: Record<string, any> = {};
    let hasErrors = false;

    selectedFunction.inputs.forEach((input, index) => {
      const inputName = input.name || `arg_${index}`;
      const value = functionArgs[inputName] || '';
      const validation = validateInput(value, input.type || 'string');
      
      if (!validation.isValid) {
        newErrors[inputName] = validation.error || 'Invalid input';
        hasErrors = true;
      } else {
        try {
          formattedArgs[inputName] = formatValue(value, input.type || 'string');
        } catch (error) {
          newErrors[inputName] = 'Invalid format';
          hasErrors = true;
        }
      }
    });

    setValidationErrors(newErrors);
    if (!hasErrors) {
      setFunctionArgs(formattedArgs);
    }
    return !hasErrors;
  };

  const generateInputFields = () => {
    if (!selectedFunction?.inputs) return null;
    
    return selectedFunction.inputs.map((input, index) => {
      const inputName = input.name || `arg_${index}`;
      return (
        <div key={index} className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {input.name || `arg_${index}`} ({input.type})
          </label>
          <input
            type="text"
            value={functionArgs[inputName] || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setFunctionArgs(prev => ({
                ...prev,
                [inputName]: newValue
              }));
              
              if (validationErrors[inputName]) {
                setValidationErrors(prev => ({
                  ...prev,
                  [inputName]: ''
                }));
              }
            }}
            onBlur={() => {
              const validation = validateInput(functionArgs[inputName] || '', input.type || 'string');
              if (!validation.isValid) {
                setValidationErrors(prev => ({
                  ...prev,
                  [inputName]: validation.error || 'Invalid input'
                }));
              }
            }}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors[inputName] ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={`Enter ${input.type || 'string'}`}
        />
        {validationErrors[inputName] && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors[inputName]}
          </p>
        )}
      </div>
      );
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Contract Playground</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Address
          </label>
          <select
            value={contractAddress}
            onChange={(e) => handleContractSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a contract</option>
            {(Array.isArray(contracts) ? contracts : []).map((contract) => (
              <option key={contract.address} value={contract.address}>
                {contract.name} ({contract.address.slice(0, 6)}...)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ABI (JSON)
          </label>
          <textarea
            value={JSON.stringify(abi, null, 2)}
            onChange={(e) => {
              try {
              const parsed = JSON.parse(e.target.value);
              if (!Array.isArray(parsed)) {
                throw new Error('ABI must be an array');
              }
              setAbi(parsed);
              setErrorMessage('');
            } catch (err) {
              // Keep invalid JSON for editing but show error
              setErrorMessage('Invalid JSON format - please fix');
              setAbi(e.target.value as any); // Store raw value for editing
            }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-32 font-mono text-sm"
            placeholder="Paste contract ABI JSON here"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Function
          </label>
          <select
            value={selectedFunction?.name || ''}
            onChange={(e) => {
              const abiArray = Array.isArray(abi) ? abi : JSON.parse(abi);
              const func = abiArray.find((f: JsonFragment) => 
                f.type === 'function' && 
                !!f.name && 
                f.name === e.target.value
              ) as (JsonFragment & {
                name: string;
                type: 'function';
                inputs?: Array<{name: string; type: string}>;
                stateMutability?: string;
              }) | null;
              setSelectedFunction(func || null);
              setFunctionArgs({});
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={abi.length === 0}
          >
            <option value="">Select a function</option>
            {(Array.isArray(abi) ? abi : JSON.parse(abi))
              .filter((item: JsonFragment) => item.type === 'function')
              .map((func: JsonFragment, index: number) => (
                <option key={index} value={func.name}>
                  {func.name} ({func.stateMutability})
                </option>
              ))}
          </select>
        </div>

        {selectedFunction && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Arguments:
            </h4>
            {generateInputFields()}
          </div>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
          disabled={!provider || !contractAddress || !selectedFunction || txStatus === 'pending'}
        >
          {txStatus === 'pending' ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Execute'
          )}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {txStatus !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <StatusBadge status={txStatus} />
              {estimatedGas && (
                <span className="text-sm text-gray-600">
                  (Est: {estimatedGas} gas)
                </span>
              )}
              {gasUsed && (
                <span className="text-sm text-gray-600">
                  (Used: {gasUsed} gas)
                </span>
              )}
              {confirmations > 0 && (
                <span className="text-sm text-gray-600">
                  ({confirmations} confirmations)
                </span>
              )}
            </div>
            {txHash && (
              <div className="text-sm">
                <a 
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View on Etherscan
                </a>
              </div>
            )}
          </div>
        )}
        
        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
            <div className="font-medium">Transaction Error:</div>
            <div>{errorMessage}</div>
          </div>
        )}

        {result && (
          <div className="p-3 bg-gray-100 rounded">
            <h3 className="font-medium mb-1">Result:</h3>
            <pre className="text-sm overflow-auto">
              {typeof result === 'object' 
                ? JSON.stringify(result, null, 2) 
                : result.toString()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
