/**
 * Error handling utilities for Callout.
 *
 * Provides error categorization, retry logic, and contextual messages.
 * All functions are pure — no environment variable reading.
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

      if (attempt < maxAttempts && shouldRetry(lastError)) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      break
    }
  }

  throw lastError?.originalError || new Error('Retry failed')
}

/* ── Error Logging ──────────────────────────────────────────── */

/**
 * Log a structured error context.
 *
 * @param errorContext - The classified error
 * @param component - Name of the component/module that encountered the error
 * @param isProduction - Whether running in production mode (enables console.error)
 */
export function logErrorContext(
  errorContext: ErrorContext,
  component?: string,
  isProduction?: boolean,
): void {
  logError(
    component || 'Unknown component',
    `[${errorContext.category}] ${errorContext.userMessage}`,
    errorContext.originalError,
    errorContext.context,
  )

  if (isProduction) {
    console.error('[Callout Error]', {
      category: errorContext.category,
      userMessage: errorContext.userMessage,
      message: errorContext.message,
      component,
      context: errorContext.context,
    })
  }
}
