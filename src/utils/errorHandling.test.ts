import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  classifyError,
  ErrorCategory,
  withRetry,
  validateAddress,
  validatePublicKey,
  validateTxHash,
} from './errorHandling'

describe('Error Classification', () => {
  it('should classify network errors', () => {
    const error = new Error('Failed to fetch')
    const result = classifyError(error)

    expect(result.category).toBe(ErrorCategory.NETWORK)
    expect(result.isRetryable).toBe(true)
    expect(result.actionableSteps).toContain('Check your internet connection')
  })

  it('should classify user rejection errors', () => {
    const error = new Error('User rejected transaction')
    const result = classifyError(error)

    expect(result.category).toBe(ErrorCategory.WALLET)
    expect(result.isRetryable).toBe(true)
    expect(result.userMessage).toBe('Transaction cancelled')
  })

  it('should classify wallet connection errors', () => {
    const error = new Error('Wallet not connected')
    const result = classifyError(error)

    expect(result.category).toBe(ErrorCategory.WALLET)
    expect(result.actionableSteps.length).toBeGreaterThan(0)
  })

  it('should classify gas errors', () => {
    const error = new Error('Insufficient funds for gas')
    const result = classifyError(error)

    expect(result.category).toBe(ErrorCategory.BLOCKCHAIN)
    expect(result.actionableSteps[0]).toContain('Add more funds')
  })

  it('should classify validation errors', () => {
    const error = new Error('Invalid address format')
    const result = classifyError(error)

    expect(result.category).toBe(ErrorCategory.VALIDATION)
    expect(result.isRetryable).toBe(false)
  })

  it('should classify encryption errors', () => {
    const error = new Error('Decryption failed: wrong passphrase')
    const result = classifyError(error)

    expect(result.category).toBe(ErrorCategory.ENCRYPTION)
    expect(result.isRetryable).toBe(false)
  })

  it('should classify unknown errors', () => {
    const error = new Error('Something completely unexpected')
    const result = classifyError(error)

    expect(result.category).toBe(ErrorCategory.UNKNOWN)
    expect(result.actionableSteps).toContain('Try refreshing the page')
  })

  it('should handle non-Error objects', () => {
    const result = classifyError('String error')

    expect(result.category).toBeDefined()
    expect(result.userMessage).toBeDefined()
    expect(result.actionableSteps.length).toBeGreaterThan(0)
  })

  it('should include context in error', () => {
    const error = new Error('Test error')
    const context = { component: 'TestComponent', action: 'testAction' }
    const result = classifyError(error, context)

    expect(result.context).toEqual(context)
  })
})

describe('Retry Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    
    const result = await withRetry(fn)
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure and succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success')
    
    const promise = withRetry(fn, { maxAttempts: 2, delayMs: 100 })
    
    // Fast-forward through delays
    await vi.runAllTimersAsync()
    const result = await promise
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should respect maxAttempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network error'))
    
    const promise = withRetry(fn, { maxAttempts: 3, delayMs: 100 })
    
    await vi.runAllTimersAsync()
    
    await expect(promise).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should apply exponential backoff', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network error'))
    
    const promise = withRetry(fn, { maxAttempts: 3, delayMs: 100, backoff: true })
    
    // Manually advance through each retry
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(100) // 1st retry after 100ms
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(200) // 2nd retry after 200ms
    await Promise.resolve()
    
    await expect(promise).rejects.toThrow()
  })

  it('should respect custom shouldRetry', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Validation error'))
    
    const promise = withRetry(fn, {
      maxAttempts: 3,
      delayMs: 100,
      shouldRetry: (errCtx) => errCtx.category === ErrorCategory.NETWORK,
    })
    
    await vi.runAllTimersAsync()
    
    // Should not retry validation errors
    await expect(promise).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('Validation Helpers', () => {
  describe('validateAddress', () => {
    it('should validate correct address', () => {
      const result = validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
      expect(result.isValid).toBe(true)
    })

    it('should reject empty address', () => {
      const result = validateAddress('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject address without 0x', () => {
      const result = validateAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('start with 0x')
    })

    it('should reject wrong length', () => {
      const result = validateAddress('0x742d35Cc')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('42 characters')
    })

    it('should reject invalid characters', () => {
      const result = validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbZ')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('invalid characters')
    })

    it('should provide suggestions', () => {
      const result = validateAddress('0x742d')
      expect(result.suggestion).toContain('too short')
    })
  })

  describe('validatePublicKey', () => {
    it('should validate 128-char public key', () => {
      const validKey = '0'.repeat(128)
      const result = validatePublicKey(validKey)
      expect(result.isValid).toBe(true)
    })

    it('should validate 130-char public key with 04 prefix', () => {
      const validKey = '04' + '0'.repeat(128)
      const result = validatePublicKey(validKey)
      expect(result.isValid).toBe(true)
    })

    it('should accept empty (optional field)', () => {
      const result = validatePublicKey('')
      expect(result.isValid).toBe(true)
    })

    it('should reject wrong length', () => {
      const result = validatePublicKey('0x1234')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('128 or 130')
    })

    it('should reject invalid characters', () => {
      const invalidKey = 'Z'.repeat(128)
      const result = validatePublicKey(invalidKey)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('invalid characters')
    })

    it('should reject 130-char key without 04 prefix', () => {
      const invalidKey = '05' + '0'.repeat(128)
      const result = validatePublicKey(invalidKey)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('start with 04')
    })
  })

  describe('validateTxHash', () => {
    it('should validate correct tx hash', () => {
      const validHash = '0x' + 'a'.repeat(64)
      const result = validateTxHash(validHash)
      expect(result.isValid).toBe(true)
    })

    it('should reject empty hash', () => {
      const result = validateTxHash('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject hash without 0x', () => {
      const result = validateTxHash('a'.repeat(64))
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('start with 0x')
    })

    it('should reject wrong length', () => {
      const result = validateTxHash('0x1234')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('66 characters')
    })

    it('should reject invalid characters', () => {
      const result = validateTxHash('0x' + 'Z'.repeat(64))
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('invalid characters')
    })

    it('should provide suggestions', () => {
      const result = validateTxHash('0x1234')
      expect(result.suggestion).toContain('too short')
    })
  })
})
