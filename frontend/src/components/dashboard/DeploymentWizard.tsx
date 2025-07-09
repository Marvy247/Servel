'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { toast } from '../../hooks/use-toast';
import { useDeploymentEvents } from '../../hooks/useDeploymentEvents';

interface Artifact {
  contractName: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  network: string;
}

type Environment = 'production' | 'staging' | 'development';

type Network = 'mainnet' | 'rinkeby' | 'goerli' | 'localhost';

const networks: Network[] = ['mainnet', 'rinkeby', 'goerli', 'localhost'];

const DeploymentWizard = () => {
  const [step, setStep] = useState<number>(1);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>(['production', 'staging', 'development']);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState<boolean | null>(null);
  const [deploymentTxHash, setDeploymentTxHash] = useState<string | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<{title: string; description: string;}[]>([]);

  const handleDeploymentEvent = useCallback((data: any) => {
    if (data) {
      if (data.type === 'deployment-log' && data.data) {
        setDeploymentLogs((logs) => [...logs, data.data]);
      } else if (data.type === 'deployment' && data.data) {
        setDeploymentLogs((logs) => [...logs, `Deployment event: Contract ${data.data.contractName} deployed at ${data.data.address} on ${data.data.network}`]);
      }
    }
  }, []);

  useDeploymentEvents((eventData) => {
    setDeploymentLogs((logs) => [...logs, `Deployment event: Contract ${eventData.contractName} deployed at ${eventData.address} on ${eventData.network}`]);
  });

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      const response = await fetch('/api/dashboard/quick-actions/artifacts');
      const data = await response.json();
      if (data.success) {
        setArtifacts(data.artifacts);
        if (data.artifacts.length > 0) {
          setSelectedArtifact(data.artifacts[0]);
        }
      } else {
        toast({
          title: 'Error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (step === 2 && selectedArtifact && selectedEnvironment && selectedNetwork) {
      fetchGasEstimateAndSuggestions();
    }
  }, [step, selectedArtifact, selectedEnvironment, selectedNetwork]);

  const fetchGasEstimateAndSuggestions = async () => {
    if (!selectedArtifact || !selectedEnvironment || !selectedNetwork) return;

    try {
      const response = await fetch('/api/dashboard/quick-actions/gas-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifact: selectedArtifact,
          environment: selectedEnvironment,
          network: selectedNetwork,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setGasEstimate(data.gasEstimate || null);
        setOptimizationSuggestions(data.optimizationSuggestions || []);
      } else {
        toast({
          title: 'Failed to fetch gas estimate',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to fetch gas estimate',
        variant: 'destructive',
      });
    }
  };

  const handleDeploy = async () => {
    if (!selectedArtifact || !selectedEnvironment || !selectedNetwork) return;

    setDeploying(true);
    setDeploymentSuccess(null);
    setDeploymentTxHash(null);
    setDeploymentLogs([]);
    setGasEstimate(null);
    setOptimizationSuggestions([]);

    try {
      const response = await fetch('/api/dashboard/quick-actions/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifact: selectedArtifact,
          environment: selectedEnvironment,
          network: selectedNetwork,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setDeploymentSuccess(true);
        setDeploymentTxHash(data.deployment.txHash || null);
        setGasEstimate(data.deployment.gasEstimate || null);
        setOptimizationSuggestions(data.deployment.optimizationSuggestions || []);
        setStep(3);
        toast({
          title: 'Deployment Successful',
          variant: 'default',
        });
      } else {
        setDeploymentSuccess(false);
        toast({
          title: 'Deployment Failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setDeploymentSuccess(false);
      toast({
        title: 'Deployment Failed',
        variant: 'destructive',
      });
    } finally {
      setDeploying(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedArtifact) {
        toast({
          title: 'Validation Error',
          variant: 'destructive',
        });
        return;
      }
      setStep(2);
      return;
    }
    if (step === 3) {
      toast({
        title: 'Deployment process completed',
        variant: 'default',
      });
      setStep(1);
      setSelectedArtifact(null);
      setSelectedEnvironment(null);
      setSelectedNetwork(null);
      setDeploymentSuccess(null);
      setDeploymentTxHash(null);
      setDeploymentLogs([]);
      setGasEstimate(null);
      setOptimizationSuggestions([]);
      return;
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Contract Deployment Wizard</h2>
        <p className="text-gray-500">Deploy your smart contracts in a few simple steps</p>
      </div>

      <Progress value={(step / 3) * 100} className="h-2 mb-6 bg-gray-100" />

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Step 1: Select Contract Artifact</h3>
            <p className="text-sm text-gray-500">Choose the contract you want to deploy from your compiled artifacts</p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Contract Artifact</label>
            <Select
              value={selectedArtifact?.contractName || ''}
              onValueChange={(value) => {
                const artifact = artifacts.find(a => a.contractName === value) || null;
                setSelectedArtifact(artifact);
              }}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select an artifact" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {artifacts.map(artifact => (
                  <SelectItem 
                    key={artifact.contractName} 
                    value={artifact.contractName}
                    className="hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{artifact.contractName}</span>
                      <span className="text-xs text-gray-500">{artifact.network}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleNext} 
              disabled={!selectedArtifact}
              className="px-6 py-3"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Step 2: Deployment Configuration</h3>
            <p className="text-sm text-gray-500">Configure the environment and network for your deployment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Environment</label>
              <Select
                value={selectedEnvironment || ''}
                onValueChange={(value) => setSelectedEnvironment(value as Environment)}
              >
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {environments.map(env => (
                    <SelectItem 
                      key={env} 
                      value={env}
                      className="hover:bg-gray-50"
                    >
                      <span className="capitalize">{env}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Network</label>
              <Select
                value={selectedNetwork || ''}
                onValueChange={(value) => setSelectedNetwork(value as Network)}
              >
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {networks.map(net => (
                    <SelectItem 
                      key={net} 
                      value={net}
                      className="hover:bg-gray-50"
                    >
                      <span className="capitalize">{net}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {gasEstimate && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Estimated Gas Cost</h4>
              <p className="text-amber-700 font-mono">{gasEstimate} gas units</p>
            </div>
          )}

          {optimizationSuggestions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Optimization Suggestions</h4>
              <ul className="space-y-2">
                {optimizationSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    <span className="font-medium">{suggestion.title}:</span> {suggestion.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button 
              onClick={handleBack} 
              variant="outline"
              className="px-6 py-3"
            >
              Back
            </Button>
            <Button 
              onClick={handleDeploy} 
              disabled={deploying || !selectedEnvironment || !selectedNetwork || !selectedArtifact}
              className="px-6 py-3"
            >
              {deploying ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deploying...
                </span>
              ) : 'Deploy'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Step 3: Deployment Status</h3>
            <p className="text-sm text-gray-500">View the progress and results of your deployment</p>
          </div>

          <div className="p-4 rounded-lg border bg-gray-50">
            {deploying ? (
              <div className="flex items-center space-x-2 text-gray-700">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Deploying contract...</span>
              </div>
            ) : deploymentSuccess === true ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Deployment successful!</span>
                </div>
                
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm font-mono break-all">
                    <span className="font-semibold">Tx Hash:</span> {deploymentTxHash}
                  </p>
                </div>

                {gasEstimate && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <h4 className="font-semibold text-amber-800 mb-1">Actual Gas Used</h4>
                    <p className="text-amber-700 font-mono">{gasEstimate} gas units</p>
                  </div>
                )}
              </div>
            ) : deploymentSuccess === false ? (
              <div className="flex items-center space-x-2 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Deployment failed. Please try again.</span>
              </div>
            ) : (
              <p className="text-gray-700">Ready to deploy.</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Deployment Logs</h4>
            <div className="p-3 bg-gray-900 rounded-md h-48 overflow-y-auto font-mono text-xs text-green-400">
              {deploymentLogs.length === 0 ? (
                <p className="text-gray-500">Waiting for logs...</p>
              ) : (
                <div className="space-y-1">
                  {deploymentLogs.map((log, index) => (
                    <p key={index} className="whitespace-pre-wrap">{`> ${log}`}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              onClick={handleBack} 
              variant="outline"
              className="px-6 py-3"
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className="px-6 py-3"
            >
              Finish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentWizard;