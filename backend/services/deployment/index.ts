import { ethers } from 'ethers';
import { ArtifactScanner } from './artifactScanner';
import { VerificationService } from './verificationService';
import { DeploymentArtifact } from '../../types';
import { DeploymentTracker } from './deploymentTracker';
import { getOptimizationSuggestions } from '../dashboard/gasOptimizationService';
import { notificationService } from '../notificationService';

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
        // Notify user of deployment success
        const userId = 'defaultUser';
        const preferences = {
          email: true,
          inApp: true,
          webhook: false,
          emailAddress: 'user@example.com',
          webhookUrl: ''
        };
        const subject = `Deployment Success: ${artifact.contractName}`;
        const message = `Contract ${artifact.contractName} was deployed successfully at address ${deployment.address} on network localhost.`;
        const webhookPayload = {
          event: 'deployment_success',
          contractName: artifact.contractName,
          address: deployment.address,
          network: 'localhost',
          timestamp: new Date().toISOString()
        };
        await notificationService.notifyUser(userId, preferences, subject, message, webhookPayload);
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      // Notify user of deployment failure
      const userId = 'defaultUser';
      const preferences = {
        email: true,
        inApp: true,
        webhook: false,
        emailAddress: 'user@example.com',
        webhookUrl: ''
      };
      const subject = 'Deployment Failure';
      const message = `Deployment failed with error: ${error instanceof Error ? error.message : String(error)}`;
      const webhookPayload = {
        event: 'deployment_failure',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
      await notificationService.notifyUser(userId, preferences, subject, message, webhookPayload);
      throw error;
    }
  }

  public async rollbackDeployment(projectId: string, network: string, contractName: string, targetAddress: string): Promise<void> {
    // Rollback to a previous deployment version by targetAddress
    const history = this.tracker.getRollbackHistory(projectId, network, contractName);
    const targetDeployment = history.find(d => d.address === targetAddress);
    if (!targetDeployment) {
      throw new Error(`No deployment found for address ${targetAddress} to rollback`);
    }
    // Redeploy the target deployment's bytecode and abi
    await this.deployContract({
      contractName: targetDeployment.contractName,
      abi: targetDeployment.abi,
      bytecode: targetDeployment.bytecode,
      deployedBytecode: targetDeployment.deployedBytecode
    }, { name: network, rpcUrl: 'http://localhost:8545' }, projectId);
    // Optionally, update tracker and notify users
    this.tracker.trackDeployment(projectId, network, targetDeployment);
    this.eventListenerService?.broadcastToClients({
      type: 'rollback',
      data: {
        contractName,
        address: targetAddress,
        network,
        timestamp: new Date().toISOString()
      }
    });
    const userId = 'defaultUser';
    const preferences = {
      email: true,
      inApp: true,
      webhook: false,
      emailAddress: 'user@example.com',
      webhookUrl: ''
    };
    const subject = `Rollback Executed: ${contractName}`;
    const message = `Contract ${contractName} was rolled back to address ${targetAddress} on network ${network}.`;
    const webhookPayload = {
      event: 'rollback_executed',
      contractName,
      address: targetAddress,
      network,
      timestamp: new Date().toISOString()
    };
    await notificationService.notifyUser(userId, preferences, subject, message, webhookPayload);
  }

  public async redeployContract(projectId: string, network: string, contractName: string): Promise<void> {
    // Redeploy the latest deployment of the contract
    const deployments = this.tracker.getRollbackHistory(projectId, network, contractName);
    if (deployments.length === 0) {
      throw new Error(`No deployments found for contract ${contractName} to redeploy`);
    }
    const latestDeployment = deployments[deployments.length - 1];
    await this.deployContract({
      contractName: latestDeployment.contractName,
      abi: latestDeployment.abi,
      bytecode: latestDeployment.bytecode,
      deployedBytecode: latestDeployment.deployedBytecode
    }, { name: network, rpcUrl: 'http://localhost:8545' }, projectId);
    this.eventListenerService?.broadcastToClients({
      type: 'redeploy',
      data: {
        contractName,
        address: latestDeployment.address,
        network,
        timestamp: new Date().toISOString()
      }
    });
    const userId = 'defaultUser';
    const preferences = {
      email: true,
      inApp: true,
      webhook: false,
      emailAddress: 'user@example.com',
      webhookUrl: ''
    };
    const subject = `Redeploy Executed: ${contractName}`;
    const message = `Contract ${contractName} was redeployed to address ${latestDeployment.address} on network ${network}.`;
    const webhookPayload = {
      event: 'redeploy_executed',
      contractName,
      address: latestDeployment.address,
      network,
      timestamp: new Date().toISOString()
    };
    await notificationService.notifyUser(userId, preferences, subject, message, webhookPayload);
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

      // Estimate gas cost before deployment
      let gasEstimate;
      try {
        const deployTransaction = await factory.getDeployTransaction();
        gasEstimate = await wallet.estimateGas(deployTransaction);
        this.eventListenerService?.broadcastToClients({
          type: 'deployment-log',
          data: `Estimated gas for deployment: ${gasEstimate.toString()}`
        });
      } catch (gasError) {
        this.eventListenerService?.broadcastToClients({
          type: 'deployment-log',
          data: `Gas estimation failed: ${gasError instanceof Error ? gasError.message : String(gasError)}`
        });
        gasEstimate = null;
      }

      // Get optimization suggestions
      const optimizationSuggestions = getOptimizationSuggestions(artifact.bytecode);

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
        // Notify user of deployment failure
        const userId = 'defaultUser';
        const preferences = {
          email: true,
          inApp: true,
          webhook: false,
          emailAddress: 'user@example.com',
          webhookUrl: ''
        };
        const subject = `Deployment Failure: ${artifact.contractName}`;
        const message = `Deployment of contract ${artifact.contractName} failed with error: ${errorMsg}`;
        const webhookPayload = {
          event: 'deployment_failure',
          contractName: artifact.contractName,
          network: network.name,
          status: 'failure',
          error: errorMsg,
          timestamp: new Date().toISOString()
        };
        await notificationService.notifyUser(userId, preferences, subject, message, webhookPayload);
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
        gasEstimate: gasEstimate ? gasEstimate.toString() : null,
        optimizationSuggestions,
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
