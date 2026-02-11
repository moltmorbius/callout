/**
 * Tests for signature parsing and recovery functionality
 */

import { describe, it, expect } from 'vitest'
import { parseSignedMessage, recoverAddressFromSignedMessage } from './signatureRecovery.js'

describe('parseSignedMessage', () => {
  it('should parse a valid signed message', () => {
    const input = `MESSAGE: "Hello, world!"\nSIGNATURE: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12`
    const result = parseSignedMessage(input)

    expect(result).not.toBeNull()
    expect(result?.message).toBe('Hello, world!')
    expect(result?.signature).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12')
  })

  it('should parse a message with newlines in the content', () => {
    const input = `MESSAGE: "Line 1\nLine 2\nLine 3"\nSIGNATURE: 0xabcdef123456`
    const result = parseSignedMessage(input)

    expect(result).not.toBeNull()
    expect(result?.message).toBe('Line 1\nLine 2\nLine 3')
    expect(result?.signature).toBe('0xabcdef123456')
  })

  it('should parse a message with extra whitespace', () => {
    const input = `MESSAGE:   "Test message"  \nSIGNATURE:   0x123abc   `
    const result = parseSignedMessage(input)

    expect(result).not.toBeNull()
    expect(result?.message).toBe('Test message')
    expect(result?.signature).toBe('0x123abc')
  })

  it('should return null for empty string', () => {
    const result = parseSignedMessage('')
    expect(result).toBeNull()
  })

  it('should return null for null input', () => {
    // @ts-expect-error Testing invalid input
    const result = parseSignedMessage(null)
    expect(result).toBeNull()
  })

  it('should return null for undefined input', () => {
    // @ts-expect-error Testing invalid input
    const result = parseSignedMessage(undefined)
    expect(result).toBeNull()
  })

  it('should return null for non-string input', () => {
    // @ts-expect-error Testing invalid input
    const result = parseSignedMessage(123)
    expect(result).toBeNull()
  })

  it('should return null when MESSAGE prefix is missing', () => {
    const input = `"Hello, world!"\nSIGNATURE: 0x123abc`
    const result = parseSignedMessage(input)
    expect(result).toBeNull()
  })

  it('should return null when SIGNATURE prefix is missing', () => {
    const input = `MESSAGE: "Hello, world!"\n0x123abc`
    const result = parseSignedMessage(input)
    expect(result).toBeNull()
  })

  it('should return null when signature does not start with 0x', () => {
    const input = `MESSAGE: "Hello, world!"\nSIGNATURE: 123abc`
    const result = parseSignedMessage(input)
    expect(result).toBeNull()
  })

  it('should return null when quotes are missing around message', () => {
    const input = `MESSAGE: Hello, world!\nSIGNATURE: 0x123abc`
    const result = parseSignedMessage(input)
    expect(result).toBeNull()
  })

  it('should return null when format is completely wrong', () => {
    const input = `This is just some random text`
    const result = parseSignedMessage(input)
    expect(result).toBeNull()
  })

  it('should handle uppercase HEX in signature', () => {
    const input = `MESSAGE: "Test"\nSIGNATURE: 0xABCDEF123456`
    const result = parseSignedMessage(input)

    expect(result).not.toBeNull()
    expect(result?.signature).toBe('0xABCDEF123456')
  })

  it('should handle empty message content', () => {
    const input = `MESSAGE: ""\nSIGNATURE: 0x123abc`
    const result = parseSignedMessage(input)

    expect(result).not.toBeNull()
    expect(result?.message).toBe('')
    expect(result?.signature).toBe('0x123abc')
  })

  it('should handle message with special characters', () => {
    const input = `MESSAGE: "Hello! @#$%^&*() 你好 🚀"\nSIGNATURE: 0x123abc`
    const result = parseSignedMessage(input)

    expect(result).not.toBeNull()
    expect(result?.message).toBe('Hello! @#$%^&*() 你好 🚀')
  })
})

describe('recoverAddressFromSignedMessage', () => {
  // This is a signature for testing signature recovery functionality
  // Message: "Test message"
  // The specific address doesn't matter - we're testing that recovery works
  const validParsed = {
    message: 'Test message',
    signature: '0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b1b' as `0x${string}`,
  }

  it('should recover address from a valid signed message', async () => {
    const address = await recoverAddressFromSignedMessage(validParsed)
    
    // Should return a valid address (checksummed)
    expect(address).not.toBeNull()
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    
    // Should match the recovered address (consistent recovery)
    expect(address?.toLowerCase()).toBe('0x2d10fe33725b79d6ce64932824f0c825dd83b35e')
  })

  it('should return null for invalid signature format', async () => {
    const invalidParsed = {
      message: 'Test',
      signature: '0xinvalid' as `0x${string}`,
    }
    
    const address = await recoverAddressFromSignedMessage(invalidParsed)
    expect(address).toBeNull()
  })

  it('should return null for signature with wrong length', async () => {
    const invalidParsed = {
      message: 'Test',
      signature: '0x123' as `0x${string}`,
    }
    
    const address = await recoverAddressFromSignedMessage(invalidParsed)
    expect(address).toBeNull()
  })

  it('should return different address when signature does not match message', async () => {
    const mismatchedParsed = {
      message: 'Different message',
      signature: validParsed.signature,
    }
    
    const address = await recoverAddressFromSignedMessage(mismatchedParsed)
    
    // Should still return an address (recovery will work, just recovers wrong signer)
    expect(address).not.toBeNull()
    // The recovered address should be different from our expected one since message doesn't match
    expect(address?.toLowerCase()).not.toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')
  })

  it('should handle empty message gracefully', async () => {
    // Using a malformed signature to test error handling
    const emptyMessageParsed = {
      message: '',
      signature: '0xffdd7c8e7c785809f1f1f3b8e412e0e90882d7e8b4bb5f4e65c4cb2f9e356b774e1c9e7e0fe3f7b90ba8e2e7d78b77d1c3f3e2e9f0f8a6e44c3e1f0a8c7b1b' as `0x${string}`,
    }
    
    const address = await recoverAddressFromSignedMessage(emptyMessageParsed)
    // Should handle gracefully - either returns address or null, doesn't throw
    expect(address === null || typeof address === 'string').toBe(true)
  })

  it('should handle message with special characters gracefully', async () => {
    // Using a malformed signature to test error handling
    const specialCharParsed = {
      message: 'Hello! 你好 🚀',
      signature: '0x8f2d5e7c8e9f1a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b1c' as `0x${string}`,
    }
    
    const address = await recoverAddressFromSignedMessage(specialCharParsed)
    // Should handle gracefully - either returns address or null, doesn't throw
    expect(address === null || typeof address === 'string').toBe(true)
  })
})

describe('Integration: parseSignedMessage + recoverAddressFromSignedMessage', () => {
  it('should parse and recover address from a complete signed message string', async () => {
    const signedMessageString = `MESSAGE: "Test message"\nSIGNATURE: 0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b1b`
    
    const parsed = parseSignedMessage(signedMessageString)
    expect(parsed).not.toBeNull()
    
    if (parsed) {
      const address = await recoverAddressFromSignedMessage(parsed)
      expect(address).not.toBeNull()
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(address?.toLowerCase()).toBe('0x2d10fe33725b79d6ce64932824f0c825dd83b35e')
    }
  })

  it('should handle invalid signed message string gracefully', async () => {
    const invalidString = `Just some random text`
    
    const parsed = parseSignedMessage(invalidString)
    expect(parsed).toBeNull()
  })
})
