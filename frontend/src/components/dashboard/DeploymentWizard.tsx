'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { toast } from '../../hooks/use-toast';

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
  const [step, setStep] = useState(1);

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const [environments, setEnvironments] = useState<Environment[]>(['production', 'staging', 'development']);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);

  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

  const [deploying, setDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState<boolean | null>(null);
  const [deploymentTxHash, setDeploymentTxHash] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);

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

  const handleNext = async () => {
    if (step === 1) {
      if (!selectedArtifact) {
      toast({
        title: 'Validation Error',
        variant: 'destructive',
      });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedEnvironment) {
      toast({
        title: 'Validation Error',
        variant: 'destructive',
      });
        return;
      }
      if (!selectedNetwork) {
      toast({
        title: 'Validation Error',
        variant: 'destructive',
      });
        return;
      }
      setStep(3);
      await handleDeploy();
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      await handleVerify();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleDeploy = async () => {
    if (!selectedArtifact || !selectedEnvironment || !selectedNetwork) return;

    setDeploying(true);
    setDeploymentSuccess(null);
    setDeploymentTxHash(null);

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
        setDeploymentTxHash(data.txHash || null);
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

  const handleVerify = async () => {
    if (!selectedArtifact || !deploymentTxHash) {
      toast({
        title: 'Verification Error',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    setVerificationSuccess(null);

    try {
      const response = await fetch('/api/quickActions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: deploymentTxHash,
          artifact: selectedArtifact,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setVerificationSuccess(true);
      toast({
        title: 'Verification Successful',
        variant: 'default',
      });
      } else {
        setVerificationSuccess(false);
      toast({
        title: 'Verification Failed',
        variant: 'destructive',
      });
      }
    } catch (error) {
      setVerificationSuccess(false);
      toast({
        title: 'Verification Failed',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold">Contract Deployment Wizard</h2>

      <Progress value={(step / 4) * 100} className="mb-4" />

      {step === 1 && (
        <div>
          <h3 className="mb-2 font-medium">Step 1: Select Contract Artifact</h3>
          <Select
            value={selectedArtifact?.contractName || ''}
            onValueChange={(value) => {
              const artifact = artifacts.find(a => a.contractName === value) || null;
              setSelectedArtifact(artifact);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an artifact" />
            </SelectTrigger>
            <SelectContent>
              {artifacts.map(artifact => (
                <SelectItem key={artifact.contractName} value={artifact.contractName}>
                  {artifact.contractName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="mb-2 font-medium">Step 2: Select Environment and Network</h3>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Environment</label>
            <Select
              value={selectedEnvironment || ''}
              onValueChange={(value) => setSelectedEnvironment(value as Environment)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {environments.map(env => (
                  <SelectItem key={env} value={env}>
                    {env}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Network</label>
            <Select
              value={selectedNetwork || ''}
              onValueChange={(value) => setSelectedNetwork(value as Network)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {networks.map(net => (
                  <SelectItem key={net} value={net}>
                    {net}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="mb-2 font-medium">Step 3: Deployment Progress</h3>
          {deploying ? (
            <p>Deploying contract...</p>
          ) : deploymentSuccess === true ? (
            <p className="text-green-600 font-medium">Deployment successful! Tx Hash: {deploymentTxHash}</p>
          ) : deploymentSuccess === false ? (
            <p className="text-red-600 font-medium">Deployment failed. Please try again.</p>
          ) : (
            <p>Ready to deploy.</p>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <h3 className="mb-2 font-medium">Step 4: Verify Contract</h3>
          {verifying ? (
            <p>Verifying contract...</p>
          ) : verificationSuccess === true ? (
            <p className="text-green-600 font-medium">Contract verified successfully!</p>
          ) : verificationSuccess === false ? (
            <p className="text-red-600 font-medium">Verification failed. Please try again.</p>
          ) : (
            <p>Click Next to verify the deployed contract.</p>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button onClick={handleBack} disabled={step === 1}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={deploying || verifying}>
          {step === 4 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default DeploymentWizard;
