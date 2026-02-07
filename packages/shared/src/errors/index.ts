/**
 * Error handling for Callout.
 *
 * Provides a CalloutError class with categorization, retry logic,
 * and user-friendly messages. All functions are pure — no environment reads.
 */

import { logError } from '../logger/index.js'

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

/* ── CalloutError Class ────────────────────────────────────── */

/**
 * Structured error with category, user-friendly messages, and recovery hints.
 * Extends native Error so it can be thrown/caught naturally.
 */
export class CalloutError extends Error {
  readonly category: ErrorCategory
  readonly userMessage: string
  readonly actionableSteps: string[]
  readonly isRetryable: boolean
  readonly originalError?: Error
  readonly context?: Record<string, unknown>

  constructor(opts: {
    category: ErrorCategory
    message: string
    userMessage: string
    actionableSteps: string[]
    isRetryable: boolean
    originalError?: Error
    context?: Record<string, unknown>
  }) {
    super(opts.message)
    this.name = 'CalloutError'
    this.category = opts.category
    this.userMessage = opts.userMessage
    this.actionableSteps = opts.actionableSteps
    this.isRetryable = opts.isRetryable
    this.originalError = opts.originalError
    this.context = opts.context
  }

  /** Create a CalloutError by classifying an unknown thrown value. */
  static from(error: unknown, context?: Record<string, unknown>): CalloutError {
    if (error instanceof CalloutError) return error
    return classifyError(error, context)
  }

  /** Log this error using the shared logger. */
  log(component?: string, isProduction?: boolean): void {
    logError(
      component ?? 'Unknown component',
      `[${this.category}] ${this.userMessage}`,
      this.originalError,
      this.context,
    )

    if (isProduction) {
      console.error('[Callout Error]', {
        category: this.category,
        userMessage: this.userMessage,
        message: this.message,
        component,
        context: this.context,
      })
    }
  }
}

/* ── Backwards-compatible interface ────────────────────────── */

/** @deprecated Use CalloutError directly. Kept for migration compatibility. */
export type ErrorContext = CalloutError

/* ── Error Classification ───────────────────────────────────── */

/**
 * Classify an error and return a structured CalloutError with
 * user-friendly messages and actionable steps.
 */
export function classifyError(error: unknown, context?: Record<string, unknown>): CalloutError {
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
    return new CalloutError({
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
    })
  }

  // Wallet: user rejection
  if (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('user cancelled') ||
    message.includes('rejected by user')
  ) {
    return new CalloutError({
      category: ErrorCategory.WALLET,
      message: err.message,
      userMessage: 'Transaction cancelled',
      actionableSteps: ['Try again and approve the transaction in your wallet'],
      isRetryable: true,
      originalError: err,
      context,
    })
  }

  // Wallet: connection
  if (
    message.includes('wallet') ||
    message.includes('not connected') ||
    message.includes('no provider') ||
    message.includes('metamask')
  ) {
    return new CalloutError({
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
    })
  }

  // Gas / blockchain
  if (
    message.includes('gas') ||
    message.includes('insufficient funds') ||
    message.includes('nonce') ||
    message.includes('underpriced')
  ) {
    return new CalloutError({
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
    })
  }

  // Transaction not found
  if (
    message.includes('not found') ||
    message.includes('404') ||
    message.includes('does not exist')
  ) {
    return new CalloutError({
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
    })
  }

  // Validation
  if (
    message.includes('invalid') ||
    message.includes('validation') ||
    message.includes('required') ||
    message.includes('must be')
  ) {
    return new CalloutError({
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
    })
  }

  // Encryption / decryption
  if (
    message.includes('decrypt') ||
    message.includes('encrypt') ||
    message.includes('passphrase') ||
    message.includes('public key') ||
    message.includes('private key')
  ) {
    return new CalloutError({
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
    })
  }

  // Unknown
  return new CalloutError({
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
  })
}

/* ── Retry Logic ────────────────────────────────────────────── */

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoff?: boolean
  shouldRetry?: (error: CalloutError) => boolean
}

/**
 * Retry a function with exponential backoff for transient errors.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
    shouldRetry = (err) => err.isRetryable,
  } = options

  let lastError: CalloutError | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = CalloutError.from(error, { attempt, maxAttempts })

      logError('Retry attempt failed', {
        attempt,
        maxAttempts,
        category: lastError.category,
        message: lastError.message,
      })

      if (attempt < maxAttempts && shouldRetry(lastError)) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      break
    }
  }

  throw lastError ?? new CalloutError({
    category: ErrorCategory.UNKNOWN,
    message: 'Retry failed',
    userMessage: 'Operation failed after multiple attempts',
    actionableSteps: ['Try again later'],
    isRetryable: false,
  })
}
