export function validateInput(value: string, type: string): { isValid: boolean; error?: string } {
  if (value.trim() === '') {
    return { isValid: false, error: 'Value cannot be empty' };
  }

  switch (type) {
    case 'uint256':
      return validateUint256(value);
    case 'address':
      return validateAddress(value);
    case 'string':
      return { isValid: true };
    case 'bool':
      return validateBoolean(value);
    default:
      if (type.startsWith('uint')) {
        return validateUint(value);
      }
      return { isValid: true, error: `Validation for type ${type} not implemented` };
  }
}

export function formatValue(value: string, type: string): any {
  switch (type) {
    case 'uint256':
    case 'uint':
      return BigInt(value);
    case 'address':
      return value.toLowerCase();
    case 'bool':
      return value.toLowerCase() === 'true';
    default:
      return value;
  }
}

function validateUint256(value: string): { isValid: boolean; error?: string } {
  try {
    const num = BigInt(value);
    if (num < 0) {
      return { isValid: false, error: 'Value must be positive' };
    }
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid uint256 value' };
  }
}

function validateUint(value: string): { isValid: boolean; error?: string } {
  try {
    const num = BigInt(value);
    if (num < 0) {
      return { isValid: false, error: 'Value must be positive' };
    }
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid unsigned integer value' };
  }
}

function validateAddress(value: string): { isValid: boolean; error?: string } {
  // Basic Ethereum address validation (0x followed by 40 hex chars)
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return { isValid: false, error: 'Invalid Ethereum address format' };
  }
  return { isValid: true };
}

function validateBoolean(value: string): { isValid: boolean; error?: string } {
  const lowerValue = value.toLowerCase();
  if (lowerValue !== 'true' && lowerValue !== 'false') {
    return { isValid: false, error: 'Value must be "true" or "false"' };
  }
  return { isValid: true };
}
