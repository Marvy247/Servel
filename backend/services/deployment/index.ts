import { ethers } from 'ethers';
import { ArtifactScanner } from './artifactScanner';
import { VerificationService } from './verificationService';
import { DeploymentArtifact } from '../../types';
import { DeploymentTracker } from './deploymentTracker';
import { getOptimizationSuggestions } from '../dashboard/gasOptimizationService';
import { notificationService } from '../notificationService';
import { DeploymentValidator } from './deploymentValidator';

export * from './artifactScanner';
export * from './verificationService';
export * from './deploymentTracker';
import dotenv from 'dotenv';

dotenv.config();

export class DeploymentService {
  private scanner: ArtifactScanner;
  private verifier: VerificationService;
  private tracker: DeploymentTracker;
  private eventListenerService: any;

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

  public async deployAllContracts(): Promise<void> {
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
            }
          });
        }
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }

public async deployContract(artifact: any, network: {name: string, rpcUrl: string}, projectId: string = 'default', constructorArgs: any[] = []) {
    try {
      // Validate constructor arguments using the DeploymentValidator
      if (artifact.constructorParams && artifact.constructorParams.length > 0) {
        const validationResult = DeploymentValidator.validateConstructorArgs(
          artifact.contractName,
          constructorArgs,
          {
            name: artifact.contractName,
            description: artifact.description || '',
            constructorParams: artifact.constructorParams
          }
        );

        if (!validationResult.valid) {
          throw new Error(`Constructor validation failed: ${validationResult.error}`);
        }
      }

      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const privateKey = process.env.PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      const wallet = new ethers.Wallet(privateKey, provider);

      const balance = await provider.getBalance(wallet.address);
      if (balance === 0n) {
        throw new Error('Wallet balance is zero. Please fund the wallet to deploy contracts.');
      }

      const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

      // Use DeploymentValidator for consistent parameter formatting
      let typedArgs: any[];
      if (artifact.constructorParams && artifact.constructorParams.length > 0) {
        // Convert array to object format for formatConstructorArgs
        const argsObject: Record<string, any> = {};
        artifact.constructorParams.forEach((param: any, index: number) => {
          argsObject[param.name] = constructorArgs[index];
        });
        
        typedArgs = DeploymentValidator.formatConstructorArgs(
          argsObject,
          {
            name: artifact.contractName,
            description: artifact.description || '',
            constructorParams: artifact.constructorParams
          }
        );
      } else {
        typedArgs = constructorArgs;
      }

      const contract = await factory.deploy(...typedArgs);
      await contract.waitForDeployment();

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

      return {
        contractName: artifact.contractName,
        address: deployedAddress,
        network: network.name,
        txHash: contract.deploymentTransaction()?.hash,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in deployContract:', error);
      throw error;
    }
  }

  public getTrackedDeployments(): Record<string, DeploymentArtifact[]> {
    return this.tracker.getAllDeployments();
  }
}
