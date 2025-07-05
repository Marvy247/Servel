import { JsonRpcProvider } from 'ethers';
import { DeploymentArtifact } from '../../types';

export class VerificationService {
  private provider: JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  async verifyContract(
    contractAddress: string,
    expectedArtifact: DeploymentArtifact
  ): Promise<boolean> {
    try {
      // Verify bytecode matches
      const bytecodeMatches = await this.verifyBytecode(contractAddress, expectedArtifact.bytecode);
      if (!bytecodeMatches) {
        console.error('Bytecode does not match for contract at', contractAddress);
        return false;
      }

      // Additional verification logic can be added here, e.g., ABI matching, metadata checks

      return true;
    } catch (error) {
      console.error('Error during contract verification:', error);
      return false;
    }
  }

  async verifyBytecode(
    contractAddress: string,
    expectedBytecode: string
  ): Promise<boolean> {
    const actualBytecode = await this.provider.getCode(contractAddress);
    // Normalize bytecode strings for comparison
    const normalize = (code: string) => code.toLowerCase().replace(/^0x/, '');
    return normalize(actualBytecode) === normalize(expectedBytecode);
  }
}
