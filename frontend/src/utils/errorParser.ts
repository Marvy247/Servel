export function parseRevertReason(error: any): string {
  if (!error) return 'Unknown error';

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;

    // Check for common revert reason patterns
    const revertMatch = message.match(/reason string: '(.+?)'/);
    if (revertMatch) {
      return revertMatch[1];
    }

    const revertHexMatch = message.match(/reverted with reason string (0x[0-9a-fA-F]+)/);
    if (revertHexMatch) {
      return decodeRevertReason(revertHexMatch[1]);
    }

    const customErrorMatch = message.match(/custom error '(.+?)'/);
    if (customErrorMatch) {
      return `Custom error: ${customErrorMatch[1]}`;
    }

    // Fallback to original message
    return message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle object with message property
  if (typeof error === 'object' && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

function decodeRevertReason(hexString: string): string {
  try {
    // Remove 0x prefix
    hexString = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    
    // First 8 bytes are the function selector, we skip those
    const reasonHex = hexString.slice(8);
    
    // Convert hex to string
    let str = '';
    for (let i = 0; i < reasonHex.length; i += 2) {
      const byte = parseInt(reasonHex.substr(i, 2), 16);
      if (byte === 0) break; // Stop at null terminator
      str += String.fromCharCode(byte);
    }
    
    return str || 'Unknown revert reason';
  } catch (error) {
    return 'Failed to decode revert reason';
  }
}
