import { DeploymentService } from '@services/deployment';
import { ArtifactScanner } from '@services/deployment/artifactScanner';
import { VerificationService } from '@services/deployment/verificationService';
import { DeploymentTracker } from '@services/deployment/deploymentTracker';
import { ethers } from 'ethers';

jest.mock('@services/deployment/artifactScanner');
jest.mock('@services/deployment/verificationService');
jest.mock('@services/deployment/deploymentTracker');

describe('DeploymentService', () => {
  let service: DeploymentService;
  const mockRpcUrl = 'http://localhost:8545';

  beforeEach(() => {
    service = new DeploymentService(mockRpcUrl);
  });

  describe('deployAllContracts', () => {
    it('should successfully deploy and track contracts', async () => {
      const mockArtifacts = [{
        contractName: 'TestContract1',
        abi: [],
        bytecode: '0x1234',
        deployedBytecode: '0x5678'
      }];
      
      const mockDeployment = {
        contractName: 'TestContract1',
        address: '0x1234567890',
        network: 'localhost',
        txHash: '0x987654321',
        timestamp: new Date().toISOString()
      };

      (ArtifactScanner.prototype.scanArtifacts as jest.Mock).mockResolvedValue(mockArtifacts);
      jest.spyOn(service, 'deployContract').mockResolvedValue(mockDeployment);
      (VerificationService.prototype.verifyContract as jest.Mock).mockResolvedValue(true);
      (DeploymentTracker.prototype.trackDeployment as jest.Mock).mockImplementation(() => {});

      await service.deployAllContracts();

      expect(ArtifactScanner.prototype.scanArtifacts).toHaveBeenCalled();
      expect(service.deployContract).toHaveBeenCalledWith(mockArtifacts[0], {
        name: 'localhost',
        rpcUrl: 'http://localhost:8545'
      });
      expect(VerificationService.prototype.verifyContract).toHaveBeenCalled();
      expect(DeploymentTracker.prototype.trackDeployment).toHaveBeenCalled();
    });

    it('should handle artifact scanning errors', async () => {
      (ArtifactScanner.prototype.scanArtifacts as jest.Mock).mockRejectedValue(new Error('Scan failed'));
      
      await expect(service.deployAllContracts()).rejects.toThrow('Scan failed');
      expect(ArtifactScanner.prototype.scanArtifacts).toHaveBeenCalled();
    });

    it('should handle contract deployment failures', async () => {
      const mockArtifacts = [{
        contractName: 'TestContract1',
        abi: [],
        bytecode: '0x1234',
        deployedBytecode: '0x5678'
      }];
      
      (ArtifactScanner.prototype.scanArtifacts as jest.Mock).mockResolvedValue(mockArtifacts);
      jest.spyOn(service, 'deployContract').mockRejectedValue(new Error('Deployment failed'));

      await expect(service.deployAllContracts()).rejects.toThrow('Deployment failed');
      expect(ArtifactScanner.prototype.scanArtifacts).toHaveBeenCalled();
      expect(service.deployContract).toHaveBeenCalled();
    });

    it('should handle verification failures', async () => {
      const mockArtifacts = [{
        contractName: 'TestContract1',
        abi: [],
        bytecode: '0x1234',
        deployedBytecode: '0x5678'
      }];
      
      const mockDeployment = {
        contractName: 'TestContract1',
        address: '0x1234567890',
        network: 'localhost',
        txHash: '0x987654321',
        timestamp: new Date().toISOString()
      };

      (ArtifactScanner.prototype.scanArtifacts as jest.Mock).mockResolvedValue(mockArtifacts);
      jest.spyOn(service, 'deployContract').mockResolvedValue(mockDeployment);
      (VerificationService.prototype.verifyContract as jest.Mock).mockRejectedValue(new Error('Verification failed'));

      await expect(service.deployAllContracts()).rejects.toThrow('Verification failed');
      expect(ArtifactScanner.prototype.scanArtifacts).toHaveBeenCalled();
      expect(service.deployContract).toHaveBeenCalled();
      expect(VerificationService.prototype.verifyContract).toHaveBeenCalled();
    });
  });

  describe('deployContract', () => {
    it('should deploy a contract successfully', async () => {
      const mockArtifact = {
        contractName: 'TestContract',
        abi: [],
        bytecode: '0x1234',
        deployedBytecode: '0x5678'
      };
      const mockNetwork = {
        name: 'localhost',
        rpcUrl: 'http://localhost:8545'
      };

      const mockContract = {
        waitForDeployment: jest.fn().mockResolvedValue(true),
        getAddress: jest.fn().mockResolvedValue('0x1234567890'),
        deploymentTransaction: jest.fn().mockReturnValue({ hash: '0x987654321' })
      };
      
      const mockFactory = {
        deploy: jest.fn().mockResolvedValue(mockContract)
      };
      
      jest.spyOn(ethers, 'JsonRpcProvider').mockReturnValue({} as any);
      jest.spyOn(ethers, 'Wallet').mockReturnValue({} as any);
      jest.spyOn(ethers, 'ContractFactory').mockReturnValue(mockFactory as any);

      const result = await service.deployContract(mockArtifact, mockNetwork);

      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(mockNetwork.rpcUrl);
      expect(ethers.Wallet).toHaveBeenCalledWith(process.env.PRIVATE_KEY, {});
      expect(ethers.ContractFactory).toHaveBeenCalledWith(
        mockArtifact.abi,
        mockArtifact.bytecode,
        {}
      );
      expect(mockFactory.deploy).toHaveBeenCalled();
      expect(mockContract.waitForDeployment).toHaveBeenCalled();
      
      expect(result).toEqual({
        contractName: mockArtifact.contractName,
        address: '0x1234567890',
        network: mockNetwork.name,
        txHash: '0x987654321',
        timestamp: expect.any(String)
      });
    });

    it('should handle provider errors', async () => {
      const mockArtifact = {
        contractName: 'TestContract',
        abi: [],
        bytecode: '0x1234',
        deployedBytecode: '0x5678'
      };
      const mockNetwork = {
        name: 'localhost',
        rpcUrl: 'http://localhost:8545'
      };

      jest.spyOn(ethers, 'JsonRpcProvider').mockImplementation(() => {
        throw new Error('Provider error');
      });

      await expect(service.deployContract(mockArtifact, mockNetwork)).rejects.toThrow('Provider error');
    });

    it('should handle wallet errors', async () => {
      const mockArtifact = {
        contractName: 'TestContract',
        abi: [],
        bytecode: '0x1234',
        deployedBytecode: '0x5678'
      };
      const mockNetwork = {
        name: 'localhost',
        rpcUrl: 'http://localhost:8545'
      };

      jest.spyOn(ethers, 'JsonRpcProvider').mockReturnValue({} as any);
      jest.spyOn(ethers, 'Wallet').mockImplementation(() => {
        throw new Error('Wallet error');
      });

      await expect(service.deployContract(mockArtifact, mockNetwork)).rejects.toThrow('Wallet error');
    });
  });
});
