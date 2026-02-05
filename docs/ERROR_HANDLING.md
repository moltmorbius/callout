# Error Handling Guide

This document describes the comprehensive error handling system implemented in Callout.

## Overview

The error handling system provides:
- **Error categorization** with user-friendly messages
- **Retry logic** for transient errors (network issues, RPC failures)
- **Validation feedback** with actionable steps
- **Production error logging** for debugging

## Error Categories

All errors are classified into one of these categories:

| Category | Description | Retryable | Examples |
|---|---|---|---|
| `NETWORK` | Connection issues, RPC failures | ✅ Yes | Fetch errors, timeouts, connection refused |
| `WALLET` | Wallet connection or user actions | ✅ Yes* | User rejection, disconnected wallet, locked extension |
| `BLOCKCHAIN` | On-chain transaction issues | ⚠️ Some | Gas errors, nonce issues, tx not found |
| `VALIDATION` | Input validation failures | ❌ No | Invalid address format, missing fields |
| `ENCRYPTION` | Encryption/decryption failures | ❌ No | Wrong passphrase, invalid keys |
| `UNKNOWN` | Unexpected errors | ❌ No | Uncategorized errors |

\* User rejections are retryable, but require user action.

## Using Error Handling

### Basic Error Classification

```typescript
import { classifyError, logErrorContext } from '@/utils/errorHandling'

try {
  await sendTransaction(...)
} catch (err) {
  const errorContext = classifyError(err, {
    component: 'MessageComposer',
    action: 'sendTransaction',
  })
  
  logErrorContext(errorContext, 'MessageComposer')
  
  // Show user-friendly error
  toast({
    title: errorContext.userMessage,
    description: errorContext.actionableSteps.join(' • '),
    status: 'error',
  })
}
```

### Automatic Retry Logic

The `withRetry` function automatically retries transient errors:

```typescript
import { withRetry } from '@/utils/errorHandling'

// Retry with defaults (3 attempts, exponential backoff)
const result = await withRetry(async () => {
  return await fetchTransaction(txHash)
})

// Custom retry configuration
const result = await withRetry(
  async () => fetchAddressTransactions(address),
  {
    maxAttempts: 5,
    delayMs: 1000,
    backoff: true, // Exponential backoff
    shouldRetry: (errCtx) => {
      // Only retry network errors
      return errCtx.category === 'NETWORK'
    },
  }
)
```

**Default retry behavior:**
- Max attempts: 3
- Initial delay: 1000ms
- Exponential backoff: enabled
- Retries: Network and some wallet errors

### Input Validation

Use validation helpers for better user feedback:

```typescript
import { validateAddress, validateTxHash, validatePublicKey } from '@/utils/errorHandling'

// Validate address
const validation = validateAddress(userInput)
if (!validation.isValid) {
  setError(`${validation.error}. ${validation.suggestion}`)
  return
}

// Validate transaction hash
const txValidation = validateTxHash(txHash)
if (!txValidation.isValid) {
  console.error(txValidation.error, txValidation.suggestion)
}

// Validate public key for encryption
const keyValidation = validatePublicKey(publicKey)
if (!keyValidation.isValid) {
  toast({
    title: 'Invalid Public Key',
    description: keyValidation.suggestion,
    status: 'warning',
  })
}
```

## Error Context Structure

Every classified error returns an `ErrorContext` object:

```typescript
interface ErrorContext {
  category: ErrorCategory           // Error category
  message: string                    // Original error message
  userMessage: string                // User-friendly summary
  actionableSteps: string[]          // What the user should do
  isRetryable: boolean               // Can this be retried?
  originalError?: Error              // Original error object
  context?: Record<string, unknown>  // Additional context
}
```

## Component Integration

### MessageComposer

- Validates target address before sending
- Validates encryption public key
- Retries network errors during transaction submission
- Shows contextual errors with actionable steps

### DecryptMessage

- Validates transaction hash format
- Retries RPC calls with exponential backoff
- Shows specific decryption error messages
- Handles both raw calldata and tx hash inputs

### MessageFeed

- Validates address before fetching
- Retries BlockScout API calls
- Handles pagination errors gracefully
- Shows contextual error messages

## Best Practices

### 1. Always Classify Errors

```typescript
// ❌ Bad: Generic error message
catch (err) {
  toast({ title: 'Error', description: err.message })
}

// ✅ Good: Classified with context
catch (err) {
  const errorContext = classifyError(err, { component: 'MyComponent' })
  logErrorContext(errorContext, 'MyComponent.handleAction')
  toast({
    title: errorContext.userMessage,
    description: errorContext.actionableSteps.join(' • '),
  })
}
```

### 2. Validate Early

```typescript
// ❌ Bad: Let viem throw validation errors
const tx = await sendTransaction({ to: userInput, ... })

// ✅ Good: Validate before attempting
const validation = validateAddress(userInput)
if (!validation.isValid) {
  setError(`${validation.error}. ${validation.suggestion}`)
  return
}
const tx = await sendTransaction({ to: userInput, ... })
```

### 3. Use Retry for Network Operations

```typescript
// ❌ Bad: Single attempt, fails on transient errors
const tx = await fetchTransaction(hash)

// ✅ Good: Retry transient failures
const tx = await withRetry(() => fetchTransaction(hash))
```

### 4. Provide Actionable Steps

```typescript
// ❌ Bad: Tell user what went wrong
"Network error"

// ✅ Good: Tell user what to do
"Network connection issue: Check your internet connection • Try again in a few moments • If the issue persists, the RPC node may be down"
```

## Testing

Error handling is fully tested. Run tests with:

```bash
npm test -- errorHandling.test.ts
```

Tests cover:
- Error classification for all categories
- Retry logic with backoff
- Validation helpers
- Custom retry predicates

## Extending

### Adding New Error Categories

1. Add to `ErrorCategory` enum in `errorHandling.ts`
2. Add classification logic in `classifyError()`
3. Add tests in `errorHandling.test.ts`

### Custom Error Classification

```typescript
const errorContext = classifyError(err)

// Override classification for specific cases
if (myCustomCondition) {
  errorContext.userMessage = 'Custom message'
  errorContext.actionableSteps = ['Custom step 1', 'Custom step 2']
}
```

### Production Error Tracking

To integrate with error tracking services (Sentry, LogRocket, etc.), update `logErrorContext()`:

```typescript
export function logErrorContext(errorContext: ErrorContext, component?: string): void {
  // Development logging
  logError(component, errorContext)
  
  // Production tracking
  if (import.meta.env.PROD) {
    Sentry.captureException(errorContext.originalError, {
      tags: { category: errorContext.category },
      extra: { context: errorContext.context },
    })
  }
}
```

## FAQ

**Q: Why are some errors retryable and others not?**

Network errors and transient blockchain issues (like nonce conflicts) can often succeed on retry. Validation errors and user rejections cannot be fixed by retrying — they require user action.

**Q: How many times should I retry?**

- RPC calls: 3-5 attempts (network may be temporarily down)
- Wallet operations: 1-2 attempts (user may need to take action)
- Validation: 0 attempts (retry won't help)

**Q: Should I always use exponential backoff?**

Yes, for network operations. Exponential backoff prevents overwhelming a struggling RPC node. Start with 1s, then 2s, 4s, etc.

**Q: What about errors in production?**

All errors are logged to the console even in production. Integrate with a service like Sentry by updating `logErrorContext()` to send errors to your tracking platform.

## See Also

- [Testing Guide](./TESTING.md) - Testing components with error handling
- [Development Setup](./DEVELOPMENT.md) - Local development
- [API Reference](./API.md) - Complete API documentation
