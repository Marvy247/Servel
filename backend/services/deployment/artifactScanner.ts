import { JsonRpcProvider } from 'ethers';
import { DeploymentArtifact } from '../../types';
import fs from 'fs';
import path from 'path';

export class ArtifactScanner {
  private provider: JsonRpcProvider;
  private contractsPath: string;

  constructor(rpcUrl: string, contractsPath: string = path.join(__dirname, '../../../contracts')) {
    this.provider = new JsonRpcProvider(rpcUrl);
    this.contractsPath = contractsPath;
  }

  async scan(contractAddress: string): Promise<DeploymentArtifact> {
    // Implementation to scan contract artifacts
    return {
      address: contractAddress,
      abi: [],
      bytecode: '',
      deployedBytecode: '',
      network: ''
    };
  }

  async scanArtifacts(): Promise<DeploymentArtifact[]> {
    const artifacts: DeploymentArtifact[] = [];
    const outPath = path.join(this.contractsPath, 'out');

    try {
      if (!fs.existsSync(outPath)) {
        console.warn(`Contracts output directory not found: ${outPath}`);
        return artifacts;
      }

      // Read all contract directories in the out folder
      const contractDirs = fs.readdirSync(outPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const contractDir of contractDirs) {
        const contractPath = path.join(outPath, contractDir);
        const jsonFiles = fs.readdirSync(contractPath)
          .filter(file => file.endsWith('.json') && !file.startsWith('.'));
        
        for (const jsonFile of jsonFiles) {
          try {
            const artifactPath = path.join(contractPath, jsonFile);
            const artifactData = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            
            if (artifactData.abi && artifactData.bytecode && artifactData.bytecode.object) {
              artifacts.push({
                contractName: path.basename(jsonFile, '.json'),
                address: '',
                abi: artifactData.abi,
                bytecode: artifactData.bytecode.object,
                deployedBytecode: artifactData.deployedBytecode?.object || '',
                network: ''
              });
            }
          } catch (parseError) {
            console.warn(`Failed to parse artifact ${jsonFile}:`, parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error scanning artifacts:', error);
    }

    return artifacts;
  }

  async getArtifactByName(contractName: string): Promise<DeploymentArtifact | null> {
    const outPath = path.join(this.contractsPath, 'out');
    
    try {
      if (!fs.existsSync(outPath)) {
        console.warn(`Contracts output directory not found: ${outPath}`);
        return null;
      }

      // Try multiple strategies to find the artifact

      // Strategy 1: Direct file lookup
      const directPath = path.join(outPath, `${contractName}.sol`, `${contractName}.json`);
      if (fs.existsSync(directPath)) {
        const artifactData = JSON.parse(fs.readFileSync(directPath, 'utf8'));
        if (artifactData.abi && artifactData.bytecode && artifactData.bytecode.object) {
          return {
            contractName,
            address: '',
            abi: artifactData.abi,
            bytecode: artifactData.bytecode.object,
            deployedBytecode: artifactData.deployedBytecode?.object || '',
            network: ''
          };
        }
      }

      // Strategy 2: Scan all directories
      const contractDirs = fs.readdirSync(outPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const contractDir of contractDirs) {
        const contractPath = path.join(outPath, contractDir);
        
        // Check if this directory contains our target contract
        const jsonFiles = fs.readdirSync(contractPath)
          .filter(file => file.endsWith('.json') && !file.startsWith('.'));
        
        for (const jsonFile of jsonFiles) {
          if (path.basename(jsonFile, '.json') === contractName) {
            try {
              const artifactPath = path.join(contractPath, jsonFile);
              const artifactData = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
              
              if (artifactData.abi && artifactData.bytecode && artifactData.bytecode.object) {
                return {
                  contractName,
                  address: '',
                  abi: artifactData.abi,
                  bytecode: artifactData.bytecode.object,
                  deployedBytecode: artifactData.deployedBytecode?.object || '',
                  network: ''
                };
              }
            } catch (parseError) {
              console.warn(`Failed to parse artifact ${jsonFile}:`, parseError);
            }
          }
        }
      }

      // Strategy 3: Try to find any file that might contain the contract
      for (const contractDir of contractDirs) {
        const contractPath = path.join(outPath, contractDir);
        const jsonFiles = fs.readdirSync(contractPath)
          .filter(file => file.endsWith('.json') && !file.startsWith('.'));
        
        for (const jsonFile of jsonFiles) {
          try {
            const artifactPath = path.join(contractPath, jsonFile);
            const artifactData = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            
            // Check if this artifact contains our contract name in any field
            if (artifactData.contractName === contractName || 
                artifactData.sourceName?.includes(contractName) ||
                jsonFile.includes(contractName)) {
              
              if (artifactData.abi && artifactData.bytecode && artifactData.bytecode.object) {
                return {
                  contractName,
                  address: '',
                  abi: artifactData.abi,
                  bytecode: artifactData.bytecode.object,
                  deployedBytecode: artifactData.deployedBytecode?.object || '',
                  network: ''
                };
              }
            }
          } catch (parseError) {
            console.warn(`Failed to parse artifact ${jsonFile}:`, parseError);
          }
        }
      }

    } catch (error) {
      console.error(`Error getting artifact for ${contractName}:`, error);
    }

    return null;
  }
}
