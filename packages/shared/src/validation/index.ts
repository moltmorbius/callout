/**
 * Validation helpers for Ethereum addresses, public keys,
 * and transaction hashes.
 *
 * Uses viem's built-in validators where possible.
 */

import { isAddress as viemIsAddress, isHash as viemIsHash, isHex } from 'viem'

export interface ValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

/* ── Address validation ───────────────────────────────────── */

/**
 * Validate an Ethereum address with helpful suggestions.
 * Uses viem's isAddress under the hood (supports EIP-55 checksums).
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

  if (!viemIsAddress(trimmed)) {
    return {
      isValid: false,
      error: 'Not a valid Ethereum address',
      suggestion: 'Check for invalid characters or incorrect checksum',
    }
  }

  return { isValid: true }
}

/* ── Public key validation ────────────────────────────────── */

/**
 * Validate a public key for ECIES encryption.
 * Expects uncompressed secp256k1: 04 prefix + 64 bytes (128 hex chars).
 */
export function validatePublicKey(publicKey: string): ValidationResult {
  const trimmed = publicKey.trim()

  if (!trimmed) {
    return { isValid: true } // Optional field
  }

  // Remove 0x prefix for validation
  const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed

  // Check it's valid hex
  if (!isHex(`0x${hex}`)) {
    return {
      isValid: false,
      error: 'Public key contains invalid characters',
      suggestion: 'Only hexadecimal characters (0-9, a-f) are allowed',
    }
  }

  // Uncompressed public key: 04 prefix + 64 bytes = 130 hex chars
  // Or just 64 bytes = 128 hex chars (without 04 prefix)
  if (hex.length !== 128 && hex.length !== 130) {
    return {
      isValid: false,
      error: `Public key must be 128 or 130 hex characters (got ${hex.length})`,
      suggestion: 'Export your uncompressed public key from your wallet',
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

/* ── Transaction hash validation ──────────────────────────── */

/**
 * Validate a transaction hash.
 * Uses viem's isHash (checks for 32-byte hex).
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

  if (!viemIsHash(trimmed)) {
    return {
      isValid: false,
      error: 'Not a valid transaction hash',
      suggestion: 'Only hexadecimal characters (0-9, a-f) are allowed after 0x',
    }
  }

  return { isValid: true }
}

/* ── Quick boolean checks ─────────────────────────────────── */

/**
 * Check if a string looks like a transaction hash (32-byte hex).
 * Delegates to viem's isHash.
 */
export function isTxHash(input: string): boolean {
  return viemIsHash(input.trim())
}

/**
 * Check if a string looks like an Ethereum address (20-byte hex).
 * Delegates to viem's isAddress.
 */
export function isAddress(input: string): boolean {
  return viemIsAddress(input.trim())
}
