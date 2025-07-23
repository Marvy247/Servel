interface ConstructorParam {
  name: string;
  type: string;
  description?: string;
}

interface ContractMetadata {
  name: string;
  description: string;
  constructorParams: ConstructorParam[];
  icon?: string;
}

export class DeploymentValidator {
  static validateConstructorArgs(
    contractName: string,
    constructorArgs: any[],
    contractMetadata: ContractMetadata
  ): { valid: boolean; error?: string; expectedParams?: number; receivedParams?: number } {
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
      
      try {
        switch (param.type) {
          case 'uint256':
          case 'uint128':
          case 'uint64':
          case 'uint32':
          case 'uint16':
          case 'uint8':
            BigInt(value);
            break;
          case 'address':
            if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
              return {
                valid: false,
                error: `Invalid address format for parameter ${param.name}: ${value}`
              };
            }
            break;
          case 'bool':
            const boolStr = String(value).toLowerCase();
            if (boolStr !== 'true' && boolStr !== 'false' && boolStr !== '0' && boolStr !== '1') {
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
        }
      } catch (error) {
        return {
          valid: false,
          error: `Invalid value for parameter ${param.name} (${param.type}): ${value}`
        };
      }
    }

    return { valid: true };
  }

  static formatConstructorArgs(
    constructorArgs: Record<string, string>,
    contractMetadata: ContractMetadata
  ): any[] {
    return contractMetadata.constructorParams.map(param => {
      const value = constructorArgs[param.name];
      
      switch (param.type) {
        case 'uint256':
        case 'uint128':
        case 'uint64':
        case 'uint32':
        case 'uint16':
        case 'uint8':
          return BigInt(value).toString();
        case 'address':
          return value;
        case 'bool':
          return value === 'true' || value === '1';
        case 'string':
          return value;
        default:
          return value;
      }
    });
  }
}
