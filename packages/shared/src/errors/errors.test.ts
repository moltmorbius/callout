import { describe, it, expect } from 'vitest'
import { classifyError, CalloutError, ErrorCategory, withRetry } from './index.js'

describe('errors', () => {
  describe('classifyError', () => {
    it('should classify network errors', () => {
      const err = classifyError(new Error('Failed to fetch'))
      expect(err).toBeInstanceOf(CalloutError)
      expect(err.category).toBe(ErrorCategory.NETWORK)
      expect(err.isRetryable).toBe(true)
    })

    it('should classify user rejection errors', () => {
      const err = classifyError(new Error('User rejected the request'))
      expect(err.category).toBe(ErrorCategory.WALLET)
      expect(err.userMessage).toContain('cancelled')
    })

    it('should classify gas errors', () => {
      const err = classifyError(new Error('insufficient funds for gas'))
      expect(err.category).toBe(ErrorCategory.BLOCKCHAIN)
    })

    it('should classify encryption errors', () => {
      const err = classifyError(new Error('Failed to decrypt with private key'))
      expect(err.category).toBe(ErrorCategory.ENCRYPTION)
    })

    it('should classify validation errors', () => {
      const err = classifyError(new Error('Invalid address format'))
      expect(err.category).toBe(ErrorCategory.VALIDATION)
    })

    it('should fall back to UNKNOWN for unrecognized errors', () => {
      const err = classifyError(new Error('Something completely unexpected'))
      expect(err.category).toBe(ErrorCategory.UNKNOWN)
      expect(err.isRetryable).toBe(false)
    })

    it('should handle non-Error objects', () => {
      const err = classifyError('string error')
      expect(err).toBeInstanceOf(CalloutError)
      expect(err.message).toBe('string error')
    })

    it('should preserve context', () => {
      const ctx = { component: 'Test' }
      const err = classifyError(new Error('test'), ctx)
      expect(err.context).toEqual(ctx)
    })
  })

  describe('CalloutError.from', () => {
    it('should return existing CalloutError unchanged', () => {
      const original = classifyError(new Error('network error'))
      const result = CalloutError.from(original)
      expect(result).toBe(original)
    })

    it('should wrap non-CalloutError', () => {
      const result = CalloutError.from(new Error('test'))
      expect(result).toBeInstanceOf(CalloutError)
    })
  })

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const result = await withRetry(() => Promise.resolve(42))
      expect(result).toBe(42)
    })

    it('should retry on transient errors', async () => {
      let attempts = 0
      const result = await withRetry(
        () => {
          attempts++
          if (attempts < 3) throw new Error('Failed to fetch')
          return Promise.resolve('ok')
        },
        { delayMs: 10 },
      )
      expect(result).toBe('ok')
      expect(attempts).toBe(3)
    })

    it('should throw after max attempts', async () => {
      await expect(
        withRetry(
          () => { throw new Error('Failed to fetch') },
          { maxAttempts: 2, delayMs: 10 },
        ),
      ).rejects.toThrow()
    })

    it('should not retry non-retryable errors', async () => {
      let attempts = 0
      await expect(
        withRetry(
          () => {
            attempts++
            throw new Error('Invalid address format')
          },
          { maxAttempts: 3, delayMs: 10 },
        ),
      ).rejects.toThrow()
      expect(attempts).toBe(1)
    })
  })
})
