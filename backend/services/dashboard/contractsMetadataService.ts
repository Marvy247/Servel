export interface ConstructorParam {
  name: string;
  type: string;
  description?: string;
}

export interface ContractMetadata {
  name: string;
  description: string;
  constructorParams: ConstructorParam[];
  icon?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  expectedParams?: number;
  receivedParams?: number;
}

export function getContractsMetadata(): ContractMetadata[] {
  // Return mock contract metadata for now
  // In a real implementation, this would load from configuration files or database
  return [
    {
      name: "ERC20Token",
      description: "Standard ERC20 token contract",
      constructorParams: [
        { name: "name", type: "string", description: "Token name" },
        { name: "symbol", type: "string", description: "Token symbol" },
        { name: "initialSupply", type: "uint256", description: "Initial token supply" }
      ],
      icon: "🪙"
    },
    {
      name: "ERC721NFT",
      description: "ERC721 Non-Fungible Token contract",
      constructorParams: [
        { name: "name", type: "string", description: "NFT collection name" },
        { name: "symbol", type: "string", description: "NFT collection symbol" }
      ],
      icon: "🖼️"
    },
    {
      name: "Governor",
      description: "Governance contract for DAO voting",
      constructorParams: [
        { name: "token", type: "address", description: "Governance token address" },
        { name: "timelock", type: "address", description: "Timelock controller address" }
      ],
      icon: "🗳️"
    },
    {
      name: "Marketplace",
      description: "NFT marketplace contract",
      constructorParams: [
        { name: "feeRecipient", type: "address", description: "Address to receive marketplace fees" },
        { name: "feePercent", type: "uint256", description: "Marketplace fee percentage" }
      ],
      icon: "🏪"
    },
    {
      name: "MultiSigWallet",
      description: "Multi-signature wallet contract",
      constructorParams: [
        { name: "owners", type: "address[]", description: "List of wallet owners" },
        { name: "required", type: "uint256", description: "Number of required signatures" }
      ],
      icon: "🔐"
    }
  ];
}

export class DeploymentValidator {
  static validateConstructorArgs(
    contractName: string,
    constructorArgs: any[],
    contractMetadata: ContractMetadata
  ): ValidationResult {
    if (!contractMetadata || !contractMetadata.constructorParams) {
      return {
        valid: false,
        error: 'Invalid contract metadata: constructorParams not found'
      };
    }

    const expectedParams = contractMetadata.constructorParams.length;
    const receivedParams = constructorArgs.length;

    if (expectedParams !== receivedParams) {
      return {
        valid: false,
        error: `Constructor parameter mismatch: expected ${expectedParams} parameters, received ${receivedParams}`,
        expectedParams,
        receivedParams
      };
    }

    // Validate parameter types
    for (let i = 0; i < expectedParams; i++) {
      const param = contractMetadata.constructorParams[i];
      const value = constructorArgs[i];
      
      if (value === undefined || value === null) {
        return {
          valid: false,
          error: `Parameter ${param.name} is required but received null/undefined`
        };
      }
      
      try {
        switch (param.type) {
          case 'uint256':
          case 'uint128':
          case 'uint64':
          case 'uint32':
          case 'uint16':
          case 'uint8':
            const numValue = BigInt(value);
            if (numValue < 0) {
              return {
                valid: false,
                error: `Invalid unsigned integer value for parameter ${param.name}: ${value}`
              };
            }
            break;
          case 'int256':
          case 'int128':
          case 'int64':
          case 'int32':
          case 'int16':
          case 'int8':
            BigInt(value);
            break;
          case 'address':
            const addressStr = String(value);
            if (!/^0x[a-fA-F0-9]{40}$/.test(addressStr)) {
              return {
                valid: false,
                error: `Invalid address format for parameter ${param.name}: ${addressStr}`
              };
            }
            break;
          case 'bool':
            const boolStr = String(value).toLowerCase();
            if (!['true', 'false', '0', '1'].includes(boolStr)) {
              return {
                valid: false,
                error: `Invalid boolean value for parameter ${param.name}: ${value}`
              };
            }
            break;
          case 'string':
            if (typeof value !== 'string') {
              return {
                valid: false,
                error: `Invalid string value for parameter ${param.name}: ${value}`
              };
            }
            break;
          case 'bytes':
          case 'bytes32':
            const bytesStr = String(value);
            if (!/^0x[a-fA-F0-9]*$/.test(bytesStr)) {
              return {
                valid: false,
                error: `Invalid bytes format for parameter ${param.name}: ${bytesStr}`
              };
            }
            break;
          default:
            if (String(value).trim() === '') {
              return {
                valid: false,
                error: `Empty value for parameter ${param.name} (${param.type})`
              };
            }
        }
      } catch (error) {
        return {
          valid: false,
          error: `Invalid value for parameter ${param.name} (${param.type}): ${value} - ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    return { valid: true };
  }

  static formatConstructorArgs(
    constructorArgs: Record<string, any>,
    contractMetadata: ContractMetadata
  ): any[] {
    if (!contractMetadata || !contractMetadata.constructorParams) {
      throw new Error('Invalid contract metadata: constructorParams not found');
    }

    return contractMetadata.constructorParams.map(param => {
      const value = constructorArgs[param.name];
      
      if (value === undefined) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
      
      switch (param.type) {
        case 'uint256':
        case 'uint128':
        case 'uint64':
        case 'uint32':
        case 'uint16':
        case 'uint8':
        case 'int256':
        case 'int128':
        case 'int64':
        case 'int32':
        case 'int16':
        case 'int8':
          return BigInt(value).toString();
        case 'address':
          return String(value).toLowerCase();
        case 'bool':
          return value === 'true' || value === true || value === '1' || value === 1;
        case 'string':
          return String(value);
        case 'bytes':
        case 'bytes32':
          return String(value);
        default:
          return value;
      }
    });
  }

  static validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static validateUint(value: string | number): boolean {
    try {
      const num = BigInt(value);
      return num >= 0;
    } catch {
      return false;
    }
  }

  static validateBoolean(value: string | boolean): boolean {
    const str = String(value).toLowerCase();
    return ['true', 'false', '0', '1'].includes(str);
  }
}
