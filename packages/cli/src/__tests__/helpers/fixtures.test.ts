/**
 * Tests for test fixtures
 */

import { describe, it, expect } from 'vitest'
import {
  validAddresses,
  invalidAddresses,
  validPublicKeys,
  invalidPublicKeys,
  validHexData,
  invalidHexData,
  validMessages,
  validPrivateKeys,
  invalidPrivateKeys,
  validSignatures,
  validTransactions,
} from './fixtures'

describe('fixtures', () => {
  describe('validAddresses', () => {
    it('should contain valid Ethereum addresses', () => {
      expect(validAddresses.length).toBeGreaterThan(0)

      validAddresses.forEach((address) => {
        // Should start with 0x
        expect(address.startsWith('0x')).toBe(true)
        // Should be 42 characters (0x + 40 hex chars)
        expect(address.length).toBe(42)
        // Should only contain valid hex characters
        expect(/^0x[0-9a-fA-F]{40}$/.test(address)).toBe(true)
      })
    })

    it('should have unique addresses', () => {
      const unique = new Set(validAddresses)
      expect(unique.size).toBe(validAddresses.length)
    })
  })

  describe('invalidAddresses', () => {
    it('should contain invalid Ethereum addresses', () => {
      expect(invalidAddresses.length).toBeGreaterThan(0)

      invalidAddresses.forEach((address) => {
        // Each should fail at least one validation rule
        const isValid =
          address.startsWith('0x') &&
          address.length === 42 &&
          /^0x[0-9a-fA-F]{40}$/.test(address)

        expect(isValid).toBe(false)
      })
    })
  })

  describe('validPublicKeys', () => {
    it('should contain valid public keys', () => {
      expect(validPublicKeys.length).toBeGreaterThan(0)

      validPublicKeys.forEach((key) => {
        // Should start with 0x
        expect(key.startsWith('0x')).toBe(true)
        // Should contain only hex characters
        expect(/^0x[0-9a-fA-F]+$/.test(key)).toBe(true)
      })
    })
  })

  describe('invalidPublicKeys', () => {
    it('should contain invalid public keys', () => {
      expect(invalidPublicKeys.length).toBeGreaterThan(0)

      // All invalid keys should fail at least one validity criterion
      // (this is a sanity check that our fixtures are actually invalid)
      invalidPublicKeys.forEach((key) => {
        const hasCorrectPrefix = key.startsWith('0x')
        const isValidFormat = hasCorrectPrefix && /^0x[0-9a-fA-F]+$/.test(key)
        const hasReasonableLength = key.length >= 130 // At least 64 bytes for uncompressed key

        const isFullyValid = isValidFormat && hasReasonableLength

        // At least one of these should be false
        expect(isFullyValid).toBe(false)
      })
    })
  })

  describe('validHexData', () => {
    it('should contain valid hex strings', () => {
      expect(validHexData.length).toBeGreaterThan(0)

      validHexData.forEach((hex) => {
        // Should start with 0x
        expect(hex.startsWith('0x')).toBe(true)
        // Should only contain hex characters (or be just "0x")
        expect(/^0x[0-9a-fA-F]*$/.test(hex)).toBe(true)
        // Should have even length after 0x
        expect((hex.length - 2) % 2).toBe(0)
      })
    })
  })

  describe('invalidHexData', () => {
    it('should contain invalid hex strings', () => {
      expect(invalidHexData.length).toBeGreaterThan(0)

      invalidHexData.forEach((hex) => {
        const hasValidPrefix = hex.startsWith('0x')
        const hasValidChars = /^0x[0-9a-fA-F]*$/.test(hex)
        const hasEvenLength = hex.length > 2 && (hex.length - 2) % 2 === 0

        const isValid = hasValidPrefix && hasValidChars && hasEvenLength

        expect(isValid).toBe(false)
      })
    })
  })

  describe('validMessages', () => {
    it('should contain various message strings', () => {
      expect(validMessages.length).toBeGreaterThan(0)

      // Just verify they're strings
      validMessages.forEach((message) => {
        expect(typeof message).toBe('string')
      })
    })

    it('should include special cases', () => {
      // Should have at least one empty message
      expect(validMessages.some((m) => m === '')).toBe(true)

      // Should have at least one multi-line message
      expect(validMessages.some((m) => m.includes('\n'))).toBe(true)

      // Should have at least one with special characters
      expect(validMessages.some((m) => /[!@#$%^&*()]/.test(m))).toBe(true)
    })
  })

  describe('validPrivateKeys', () => {
    it('should contain valid private key format', () => {
      expect(validPrivateKeys.length).toBeGreaterThan(0)

      validPrivateKeys.forEach((key) => {
        // Should start with 0x
        expect(key.startsWith('0x')).toBe(true)
        // Should be 66 characters (0x + 64 hex chars)
        expect(key.length).toBe(66)
        // Should only contain hex characters
        expect(/^0x[0-9a-fA-F]{64}$/.test(key)).toBe(true)
      })
    })
  })

  describe('invalidPrivateKeys', () => {
    it('should contain invalid private keys', () => {
      expect(invalidPrivateKeys.length).toBeGreaterThan(0)

      invalidPrivateKeys.forEach((key) => {
        const isValid =
          key.startsWith('0x') &&
          key.length === 66 &&
          /^0x[0-9a-fA-F]{64}$/.test(key)

        expect(isValid).toBe(false)
      })
    })
  })

  describe('validSignatures', () => {
    it('should contain valid signature objects', () => {
      expect(validSignatures.length).toBeGreaterThan(0)

      validSignatures.forEach((sig) => {
        expect(sig).toHaveProperty('r')
        expect(sig).toHaveProperty('s')
        expect(sig).toHaveProperty('v')

        // r and s should be 32-byte hex strings (66 chars including 0x)
        expect(sig.r.length).toBe(66)
        expect(sig.s.length).toBe(66)
        expect(/^0x[0-9a-fA-F]{64}$/.test(sig.r)).toBe(true)
        expect(/^0x[0-9a-fA-F]{64}$/.test(sig.s)).toBe(true)

        // v should be 27 or 28
        expect([27, 28]).toContain(sig.v)
      })
    })
  })

  describe('validTransactions', () => {
    it('should contain valid transaction objects', () => {
      expect(validTransactions.length).toBeGreaterThan(0)

      validTransactions.forEach((tx) => {
        expect(tx).toHaveProperty('to')
        expect(tx).toHaveProperty('value')
        expect(tx).toHaveProperty('data')

        // to should be a valid address
        expect(tx.to.startsWith('0x')).toBe(true)
        expect(tx.to.length).toBe(42)

        // value should be a string of digits
        expect(/^\d+$/.test(tx.value)).toBe(true)

        // data should be valid hex
        expect(tx.data.startsWith('0x')).toBe(true)
      })
    })
  })
})
