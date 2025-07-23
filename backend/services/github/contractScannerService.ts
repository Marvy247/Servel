import { getGitHubAuthService } from './authService';

interface ContractFile {
  name: string;
  path: string;
  size: number;
  content: string;
  contractName: string;
  pragma: string;
  imports: string[];
  isTest: boolean;
  isInterface: boolean;
  isLibrary: boolean;
}

interface ContractDetectionResult {
  contracts: ContractFile[];
  libraries: ContractFile[];
  interfaces: ContractFile[];
  tests: ContractFile[];
  dependencies: string[];
}

class ContractScannerService {
  private contractPatterns = {
    contract: /contract\s+(\w+)\s*(?:is\s+[\w\s,]+)?\s*\{/g,
    library: /library\s+(\w+)\s*\{/g,
    interface: /interface\s+(\w+)\s*\{/g,
    pragma: /pragma\s+solidity\s+([^;]+);/g,
    import: /import\s+["']([^"']+)["'];/g,
    test: /test|Test|spec|Spec/i
  };

  /**
   * Scan repository for smart contracts
   */
  async scanRepository(
    sessionToken: string,
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<ContractDetectionResult> {
    const authService = await getGitHubAuthService();
    
    // Get repository structure
    const rootContents = await authService.getRepositoryContents(
      sessionToken,
      owner,
      repo,
      '',
      branch
    );

    const allFiles: ContractFile[] = [];
    const contracts: ContractFile[] = [];
    const libraries: ContractFile[] = [];
    const interfaces: ContractFile[] = [];
    const tests: ContractFile[] = [];
    const dependencies = new Set<string>();

    // Recursively scan for .sol files
    await this.scanDirectory(
      sessionToken,
      owner,
      repo,
      branch,
      '',
      allFiles,
      dependencies
    );

    // Categorize files
    for (const file of allFiles) {
      if (file.isTest) {
        tests.push(file);
      } else if (file.isInterface) {
        interfaces.push(file);
      } else if (file.isLibrary) {
        libraries.push(file);
      } else {
        contracts.push(file);
      }
    }

    return {
      contracts,
      libraries,
      interfaces,
      tests,
      dependencies: Array.from(dependencies)
    };
  }

  /**
   * Recursively scan directory for .sol files
   */
  private async scanDirectory(
    sessionToken: string,
    owner: string,
    repo: string,
    branch: string,
    path: string,
    files: ContractFile[],
    dependencies: Set<string>
  ): Promise<void> {
    const authService = await getGitHubAuthService();
    
    try {
      const contents = await authService.getRepositoryContents(
        sessionToken,
        owner,
        repo,
        path,
        branch
      );

      for (const item of contents) {
        if (item.type === 'dir') {
          // Recursively scan subdirectories
          await this.scanDirectory(
            sessionToken,
            owner,
            repo,
            branch,
            item.path,
            files,
            dependencies
          );
        } else if (item.type === 'file' && item.name.endsWith('.sol')) {
          // Process Solidity file
          try {
            const content = await authService.getFileContent(
              sessionToken,
              owner,
              repo,
              item.path,
              branch
            );
            
            const contractFile = this.parseContractFile(
              item.name,
              item.path,
              item.size,
              content
            );
            
            files.push(contractFile);
            
            // Collect dependencies
            contractFile.imports.forEach(dep => dependencies.add(dep));
          } catch (error) {
            console.warn(`Failed to process file ${item.path}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${path}:`, error);
    }
  }

  /**
   * Parse contract file content
   */
  private parseContractFile(
    name: string,
    path: string,
    size: number,
    content: string
  ): ContractFile {
    const contractName = this.extractContractName(content);
    const pragma = this.extractPragma(content);
    const imports = this.extractImports(content);
    
    const isTest = this.contractPatterns.test.test(name) || 
                   this.contractPatterns.test.test(path);
    
    const isInterface = this.contractPatterns.interface.test(content);
    const isLibrary = this.contractPatterns.library.test(content);

    return {
      name,
      path,
      size,
      content,
      contractName: contractName || name.replace('.sol', ''),
      pragma: pragma || '^0.8.0',
      imports,
      isTest,
      isInterface,
      isLibrary
    };
  }

  /**
   * Extract contract name from content
   */
  private extractContractName(content: string): string | null {
    const contractMatch = this.contractPatterns.contract.exec(content);
    return contractMatch ? contractMatch[1] : null;
  }

  /**
   * Extract pragma version from content
   */
  private extractPragma(content: string): string | null {
    const pragmaMatch = this.contractPatterns.pragma.exec(content);
    return pragmaMatch ? pragmaMatch[1].trim() : null;
  }

  /**
   * Extract imports from content
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    let match;
    
    while ((match = this.contractPatterns.import.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  /**
   * Validate contract for deployment
   */
  validateContract(contract: ContractFile): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for constructor
    const constructorMatch = /constructor\s*\([^)]*\)/.test(contract.content);
    if (!constructorMatch) {
      warnings.push('Contract has no constructor parameters');
    }

    // Check for payable functions
    const payableMatch = /payable/.test(contract.content);
    if (payableMatch) {
      warnings.push('Contract contains payable functions');
    }

    // Check for external dependencies
    const externalDeps = contract.imports.filter(imp => 
      !imp.startsWith('./') && !imp.startsWith('../')
    );
    if (externalDeps.length > 0) {
      warnings.push(`External dependencies found: ${externalDeps.join(', ')}`);
    }

    // Check for common issues
    if (contract.content.includes('selfdestruct')) {
      warnings.push('Contract contains selfdestruct');
    }

    if (contract.content.includes('delegatecall')) {
      warnings.push('Contract uses delegatecall');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get deployment configuration
   */
  getDeploymentConfig(contract: ContractFile): {
    hasConstructor: boolean;
    constructorParams: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
    estimatedGas: number;
  } {
    const hasConstructor = /constructor\s*\([^)]*\)/.test(contract.content);
    const constructorParams: Array<{
      name: string;
      type: string;
      description?: string;
    }> = [];

    if (hasConstructor) {
      const constructorMatch = contract.content.match(/constructor\s*\(([^)]*)\)/);
      if (constructorMatch) {
        const params = constructorMatch[1].split(',').map(p => p.trim());
        
        params.forEach((param, index) => {
          const [type, name] = param.split(/\s+/);
          constructorParams.push({
            name: name || `param${index}`,
            type: type || 'address',
            description: `Constructor parameter ${index + 1}`
          });
        });
      }
    }

    // Simple gas estimation based on contract size
    const estimatedGas = Math.min(5000000, contract.content.length * 100);

    return {
      hasConstructor,
      constructorParams,
      estimatedGas
    };
  }
}

// Singleton instance
let scannerService: ContractScannerService | null = null;

export async function getContractScannerService(): Promise<ContractScannerService> {
  if (!scannerService) {
    scannerService = new ContractScannerService();
  }
  return scannerService;
}

export { ContractScannerService, ContractFile, ContractDetectionResult };
