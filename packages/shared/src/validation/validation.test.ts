import { describe, it, expect } from 'vitest'
import {
  validateAddress,
  validatePublicKey,
  validateTxHash,
  isTxHash,
  isAddress,
} from './index.js'

describe('validation', () => {
  describe('validateAddress', () => {
    it('should accept a valid lowercase address', () => {
      const result = validateAddress('0x742d35cc6634c0532925a3b844bc9e7595f0bebe')
      expect(result.isValid).toBe(true)
    })

    it('should accept the zero address', () => {
      const result = validateAddress('0x0000000000000000000000000000000000000000')
      expect(result.isValid).toBe(true)
    })

    it('should reject empty string', () => {
      const result = validateAddress('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject address without 0x prefix', () => {
      const result = validateAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEbE')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('0x')
    })

    it('should reject address that is too short', () => {
      const result = validateAddress('0x742d35Cc')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('42 characters')
    })

    it('should trim whitespace', () => {
      const result = validateAddress('  0x742d35cc6634c0532925a3b844bc9e7595f0bebe  ')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validatePublicKey', () => {
    it('should accept empty string (optional field)', () => {
      const result = validatePublicKey('')
      expect(result.isValid).toBe(true)
    })

    it('should reject a public key with wrong length', () => {
      const result = validatePublicKey('0x04abcd')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('128 or 130')
    })

    it('should reject 130-char key without 04 prefix', () => {
      const key = '0x' + 'ff' + 'aa'.repeat(64)
      const result = validatePublicKey(key)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('04')
    })

    it('should accept a valid 130-char uncompressed key', () => {
      const key = '04' + 'ab'.repeat(64)
      const result = validatePublicKey(key)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateTxHash', () => {
    it('should accept a valid 66-char hex hash', () => {
      const hash = '0x' + 'ab'.repeat(32)
      const result = validateTxHash(hash)
      expect(result.isValid).toBe(true)
    })

    it('should reject empty string', () => {
      const result = validateTxHash('')
      expect(result.isValid).toBe(false)
    })

    it('should reject hash without 0x', () => {
      const result = validateTxHash('ab'.repeat(32))
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('0x')
    })

    it('should reject hash that is too short', () => {
      const result = validateTxHash('0xabcd')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('66 characters')
    })
  })

  describe('isTxHash', () => {
    it('should return true for a valid tx hash', () => {
      expect(isTxHash('0x' + 'ab'.repeat(32))).toBe(true)
    })

    it('should return false for a short string', () => {
      expect(isTxHash('0xabcd')).toBe(false)
    })
  })

  describe('isAddress', () => {
    it('should return true for a valid address', () => {
      expect(isAddress('0x742d35cc6634c0532925a3b844bc9e7595f0bebe')).toBe(true)
    })

    it('should return false for an invalid string', () => {
      expect(isAddress('not-an-address')).toBe(false)
    })
  })
})
