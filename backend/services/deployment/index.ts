import { ethers } from 'ethers';
import { ArtifactScanner } from '@services/deployment/artifactScanner';
import { VerificationService } from '@services/deployment/verificationService';
import { DeploymentTracker } from '@services/deployment/deploymentTracker';

export * from '@services/deployment/artifactScanner';
export * from '@services/deployment/verificationService';
export * from '@services/deployment/deploymentTracker';
import dotenv from 'dotenv';

dotenv.config();

export class DeploymentService {
  private scanner: ArtifactScanner;
  private verifier: VerificationService;
  private tracker: DeploymentTracker;

  constructor(rpcUrl: string = 'http://localhost:8545') {
    this.scanner = new ArtifactScanner(rpcUrl);
    this.verifier = new VerificationService(rpcUrl);
    this.tracker = new DeploymentTracker();
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
        this.tracker.trackDeployment('localhost', {
          address: deployment.address,
          abi: artifact.abi,
          bytecode: artifact.bytecode,
          deployedBytecode: '',
          network: 'localhost'
        });
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }

  public async deployContract(artifact: any, network: {name: string, rpcUrl: string}) {
    try {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      // Use Anvil default private key if PRIVATE_KEY env var is not set
      const privateKey = process.env.PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      const wallet = new ethers.Wallet(privateKey, provider);
      const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
      
      console.log(`Deploying ${artifact.contractName} to ${network.name}...`);
      const contract = await factory.deploy();
      await contract.waitForDeployment();

      return {
        contractName: artifact.contractName,
        address: await contract.getAddress(),
        network: network.name,
        txHash: contract.deploymentTransaction()?.hash,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in deployContract:', error);
      if (error instanceof Error) {
        console.error(error.stack);
      }
      throw error;
    }
  }
}
