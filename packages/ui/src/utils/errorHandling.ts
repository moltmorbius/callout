/**
 * Comprehensive error handling utilities for Callout.
 * 
 * Provides error categorization, retry logic, contextual messages,
 * and production error logging.
 */

import { logError } from './logger'

/* ── Error Categories ──────────────────────────────────────── */

export const ErrorCategory = {
  NETWORK: 'NETWORK',
  WALLET: 'WALLET',
  VALIDATION: 'VALIDATION',
  ENCRYPTION: 'ENCRYPTION',
  BLOCKCHAIN: 'BLOCKCHAIN',
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory]

export interface ErrorContext {
  category: ErrorCategory
  message: string
  userMessage: string
  actionableSteps: string[]
  isRetryable: boolean
  originalError?: Error
  context?: Record<string, unknown>
}

/* ── Error Classification ───────────────────────────────────── */

/**
 * Classify an error and return a structured error context with
 * user-friendly messages and actionable steps.
 */
export function classifyError(error: unknown, context?: Record<string, unknown>): ErrorContext {
  const err = error instanceof Error ? error : new Error(String(error))
  const message = err.message.toLowerCase()

  // Network errors
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('failed to fetch')
  ) {
    return {
      category: ErrorCategory.NETWORK,
      message: err.message,
      userMessage: 'Network connection issue',
      actionableSteps: [
        'Check your internet connection',
        'Try again in a few moments',
        'If the issue persists, the RPC node may be down',
      ],
      isRetryable: true,
      originalError: err,
      context,
    }
  }

  // Wallet errors
  if (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('user cancelled') ||
    message.includes('rejected by user')
  ) {
    return {
      category: ErrorCategory.WALLET,
      message: err.message,
      userMessage: 'Transaction cancelled',
      actionableSteps: ['Try again and approve the transaction in your wallet'],
      isRetryable: true,
      originalError: err,
      context,
    }
  }

  if (
    message.includes('wallet') ||
    message.includes('not connected') ||
    message.includes('no provider') ||
    message.includes('metamask')
  ) {
    return {
      category: ErrorCategory.WALLET,
      message: err.message,
      userMessage: 'Wallet connection issue',
      actionableSteps: [
        'Make sure your wallet is connected',
        'Try reconnecting your wallet',
        'Check if your wallet extension is unlocked',
      ],
      isRetryable: true,
      originalError: err,
      context,
    }
  }

  // Gas/blockchain errors
  if (
    message.includes('gas') ||
    message.includes('insufficient funds') ||
    message.includes('nonce') ||
    message.includes('underpriced')
  ) {
    return {
      category: ErrorCategory.BLOCKCHAIN,
      message: err.message,
      userMessage: 'Blockchain transaction issue',
      actionableSteps: [
        message.includes('insufficient') 
          ? 'Add more funds to your wallet for gas fees'
          : 'Try increasing the gas limit or gas price',
        'Wait a moment and try again',
      ],
      isRetryable: message.includes('nonce') || message.includes('underpriced'),
      originalError: err,
      context,
    }
  }

  // Transaction not found
  if (
    message.includes('not found') ||
    message.includes('404') ||
    message.includes('does not exist')
  ) {
    return {
      category: ErrorCategory.BLOCKCHAIN,
      message: err.message,
      userMessage: 'Transaction not found',
      actionableSteps: [
        'Verify the transaction hash is correct',
        'The transaction may not be confirmed yet — wait a moment',
        'Try switching to the correct network',
      ],
      isRetryable: false,
      originalError: err,
      context,
    }
  }

  // Validation errors
  if (
    message.includes('invalid') ||
    message.includes('validation') ||
    message.includes('required') ||
    message.includes('must be')
  ) {
    return {
      category: ErrorCategory.VALIDATION,
      message: err.message,
      userMessage: 'Input validation failed',
      actionableSteps: [
        'Check that all required fields are filled correctly',
        'Verify address formats (must start with 0x)',
      ],
      isRetryable: false,
      originalError: err,
      context,
    }
  }

  // Encryption errors
  if (
    message.includes('decrypt') ||
    message.includes('encrypt') ||
    message.includes('passphrase') ||
    message.includes('public key') ||
    message.includes('private key')
  ) {
    return {
      category: ErrorCategory.ENCRYPTION,
      message: err.message,
      userMessage: 'Encryption/decryption failed',
      actionableSteps: [
        message.includes('decrypt') 
          ? 'Verify you have the correct passphrase or private key'
          : 'Check that the public key is valid',
        'Make sure the data hasn\'t been corrupted',
      ],
      isRetryable: false,
      originalError: err,
      context,
    }
  }

  // Unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    message: err.message,
    userMessage: 'An unexpected error occurred',
    actionableSteps: [
      'Try refreshing the page',
      'If the issue persists, please report it on GitHub',
    ],
    isRetryable: false,
    originalError: err,
    context,
  }
}

/* ── Retry Logic ────────────────────────────────────────────── */

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoff?: boolean
  shouldRetry?: (error: ErrorContext) => boolean
}

/**
 * Retry a function with exponential backoff for transient errors.
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Promise resolving to the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
    shouldRetry = (errCtx) => errCtx.isRetryable,
  } = options

  let lastError: ErrorContext | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = classifyError(error, { attempt, maxAttempts })
      
      logError('Retry attempt failed', {
        attempt,
        maxAttempts,
        category: lastError.category,
        message: lastError.message,
      })

      // Check if we should retry
      if (attempt < maxAttempts && shouldRetry(lastError)) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // No more retries or error is not retryable
      break
    }
  }

  // All retries exhausted
  throw lastError?.originalError || new Error('Retry failed')
}

/* ── Error Logging ──────────────────────────────────────────── */

/**
 * Log an error to the console (dev) and to external services (production).
 * In production, you could send to Sentry, LogRocket, etc.
 */
export function logErrorContext(errorContext: ErrorContext, component?: string): void {
  logError(
    component || 'Unknown component',
    `[${errorContext.category}] ${errorContext.userMessage}`,
    errorContext.originalError,
    errorContext.context,
  )

  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(errorContext.originalError)
    // For now, just console.error so errors are visible in production
    console.error('[Callout Error]', {
      category: errorContext.category,
      userMessage: errorContext.userMessage,
      message: errorContext.message,
      component,
      context: errorContext.context,
    })
  }
}

/* ── Validation Helpers ─────────────────────────────────────── */

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
