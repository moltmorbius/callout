/**
 * Validation helpers for Ethereum addresses, public keys,
 * and transaction hashes.
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

/**
 * Validate an Ethereum address with helpful suggestions.
 */
export function validateAddress(address: string): ValidationResult {
  const trimmed = address.trim()

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Address is required',
      suggestion: 'Enter a valid Ethereum address (0x...)',
    }
  }

  if (!trimmed.startsWith('0x')) {
    return {
      isValid: false,
      error: 'Address must start with 0x',
      suggestion: 'Prepend 0x to the address',
    }
  }

  if (trimmed.length !== 42) {
    return {
      isValid: false,
      error: `Address must be 42 characters (got ${trimmed.length})`,
      suggestion: trimmed.length < 42
        ? 'Address is too short'
        : 'Address is too long',
    }
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Address contains invalid characters',
      suggestion: 'Only hexadecimal characters (0-9, a-f) are allowed after 0x',
    }
  }

  return { isValid: true }
}

/**
 * Validate a public key for encryption.
 */
export function validatePublicKey(publicKey: string): ValidationResult {
  const trimmed = publicKey.trim()

  if (!trimmed) {
    return { isValid: true } // Optional field
  }

  // Remove 0x prefix for validation
  const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed

  // Uncompressed public key: 04 prefix + 64 bytes = 130 hex chars
  // OR just 64 bytes = 128 hex chars (without 04 prefix)
  if (hex.length !== 128 && hex.length !== 130) {
    return {
      isValid: false,
      error: `Public key must be 128 or 130 hex characters (got ${hex.length})`,
      suggestion: 'Export your uncompressed public key from your wallet',
    }
  }

  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    return {
      isValid: false,
      error: 'Public key contains invalid characters',
      suggestion: 'Only hexadecimal characters (0-9, a-f) are allowed',
    }
  }

  if (hex.length === 130 && !hex.startsWith('04')) {
    return {
      isValid: false,
      error: 'Uncompressed public key must start with 04',
      suggestion: 'Make sure you exported the uncompressed format',
    }
  }

  return { isValid: true }
}

/**
 * Validate a transaction hash.
 */
export function validateTxHash(txHash: string): ValidationResult {
  const trimmed = txHash.trim()

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Transaction hash is required',
      suggestion: 'Enter a valid transaction hash (0x...)',
    }
  }

  if (!trimmed.startsWith('0x')) {
    return {
      isValid: false,
      error: 'Transaction hash must start with 0x',
      suggestion: 'Prepend 0x to the hash',
    }
  }

  if (trimmed.length !== 66) {
    return {
      isValid: false,
      error: `Transaction hash must be 66 characters (got ${trimmed.length})`,
      suggestion: trimmed.length < 66
        ? 'Hash is too short'
        : 'Hash is too long',
    }
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Transaction hash contains invalid characters',
      suggestion: 'Only hexadecimal characters (0-9, a-f) are allowed after 0x',
    }
  }

  return { isValid: true }
}

/**
 * Check if a string looks like a transaction hash.
 * 66 chars: 0x + 64 hex chars.
 */
export function isTxHash(input: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(input.trim())
}

/**
 * Check if a string looks like an Ethereum address.
 * 42 chars: 0x + 40 hex chars.
 */
export function isAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input.trim())
}
