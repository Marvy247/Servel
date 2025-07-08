import { ethers } from 'ethers';
import { ArtifactScanner } from './artifactScanner';
import { VerificationService } from './verificationService';
import { DeploymentArtifact } from '../../types';
import { DeploymentTracker } from './deploymentTracker';


export * from './artifactScanner';
export * from './verificationService';
export * from './deploymentTracker';
import dotenv from 'dotenv';

dotenv.config();

export class DeploymentService {
  private scanner: ArtifactScanner;
  private verifier: VerificationService;
  private tracker: DeploymentTracker;
  private eventListenerService: any; // Add property for event listener service

  private static instance: DeploymentService;

  private constructor(rpcUrl: string = 'http://localhost:8545') {
    this.scanner = new ArtifactScanner(rpcUrl);
    this.verifier = new VerificationService(rpcUrl);
    this.tracker = new DeploymentTracker();
  }

  public setEventListenerService(eventListenerService: any) {
    this.eventListenerService = eventListenerService;
  }

  public static getInstance(): DeploymentService {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  async deployAllContracts(): Promise<void> {
    try {
      const artifacts = await this.scanner.scanArtifacts();

      for (const artifact of artifacts) {
        const deployment = await this.deployContract(artifact, { 
          name: 'localhost',
          rpcUrl: 'http://localhost:8545'
        });
        await this.verifier.verifyContract(
          deployment.address, 
          {
            address: deployment.address,
            abi: artifact.abi,
            bytecode: artifact.bytecode,
            deployedBytecode: '',
            network: 'localhost'
          }
        );
        this.tracker.trackDeployment('default', 'localhost', {
          contractName: artifact.contractName,
          address: deployment.address,
          abi: artifact.abi,
          bytecode: artifact.bytecode,
          deployedBytecode: '',
          network: 'localhost',
          lastDeployed: new Date().toISOString()
        });
        // Broadcast deployment event
        if (this.eventListenerService) {
          this.eventListenerService.broadcastToClients({
            type: 'deployment',
            data: {
              contractName: (artifact as any).contractName || 'UnknownContract',
              address: deployment.address,
              network: 'localhost',
              verified: false,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }

  public async deployContract(artifact: any, network: {name: string, rpcUrl: string}, projectId: string = 'default') {
    try {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      // Use Anvil default private key if PRIVATE_KEY env var is not set
      const privateKey = process.env.PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      const wallet = new ethers.Wallet(privateKey, provider);

      const balance = await provider.getBalance(wallet.address);
      this.eventListenerService?.broadcastToClients({
        type: 'deployment-log',
        data: `Wallet address: ${await wallet.getAddress()}, balance: ${balance.toString()}`
      });

      if (balance === 0n) {
        const errorMsg = 'Wallet balance is zero. Please fund the wallet to deploy contracts.';
        this.eventListenerService?.broadcastToClients({
          type: 'deployment-log',
          data: errorMsg
        });
        throw new Error(errorMsg);
      }

      const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
      
      this.eventListenerService?.broadcastToClients({
        type: 'deployment-log',
        data: `Deploying ${artifact.contractName} to ${network.name}...`
      });
      const contract = await factory.deploy();
      this.eventListenerService?.broadcastToClients({
        type: 'deployment-log',
        data: 'Contract deployment transaction sent, waiting for deployment...'
      });
      try {
        await contract.waitForDeployment();
        this.eventListenerService?.broadcastToClients({
          type: 'deployment-log',
          data: `Contract deployed successfully at address: ${await contract.getAddress()}`
        });
      } catch (waitError) {
        const errorMsg = `Error while waiting for contract deployment: ${waitError instanceof Error ? waitError.message : String(waitError)}`;
        this.eventListenerService?.broadcastToClients({
          type: 'deployment-log',
          data: errorMsg
        });
        throw waitError;
      }

      const deployedAddress = await contract.getAddress();
      this.tracker.trackDeployment(projectId, network.name, {
        contractName: artifact.contractName,
        address: deployedAddress,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: '',
        network: network.name,
        lastDeployed: new Date().toISOString()
      });
      this.eventListenerService?.broadcastToClients({
        type: 'deployment',
        data: {
          contractName: (artifact as any).contractName || 'UnknownContract',
          address: deployedAddress,
          network: network.name,
          verified: false,
          timestamp: new Date().toISOString()
        }
      });
      return {
        contractName: artifact.contractName,
        address: deployedAddress,
        network: network.name,
        txHash: contract.deploymentTransaction()?.hash,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.eventListenerService?.broadcastToClients({
        type: 'deployment-log',
        data: `Error in deployContract: ${errorMsg}`
      });
      console.error('Error in deployContract:', error);
      if (error instanceof Error) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  public getTrackedDeployments(): Record<string, DeploymentArtifact[]> {
    return this.tracker.getAllDeployments();
  }
}
