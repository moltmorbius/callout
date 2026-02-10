/**
 * Test fixtures for CLI testing - valid and invalid samples
 */

/**
 * Valid Ethereum addresses for testing
 */
export const validAddresses = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
  '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
] as const

/**
 * Invalid Ethereum addresses for testing
 */
export const invalidAddresses = [
  '', // Empty
  '0x', // Too short
  '0x123', // Too short
  'not-an-address', // Invalid format
  '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', // Invalid characters
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Too short (39 chars)
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb12', // Too long (43 chars)
  '742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', // Missing 0x prefix
] as const

/**
 * Valid public keys (hex encoded, 64 bytes)
 */
export const validPublicKeys = [
  '0x04a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
  '0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
] as const

/**
 * Invalid public keys for testing
 */
export const invalidPublicKeys = [
  '', // Empty
  '0x', // Too short
  '0xabc', // Too short
  '0x04a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9', // Too short
  '04a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', // Missing 0x prefix
  '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', // Invalid characters
] as const

/**
 * Valid hex data strings (various lengths)
 */
export const validHexData = [
  '0x',
  '0x00',
  '0xdeadbeef',
  '0x1234567890abcdef',
  '0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
] as const

/**
 * Invalid hex data for testing
 */
export const invalidHexData = [
  '', // Empty
  'not-hex', // No 0x prefix
  '0xZZ', // Invalid characters
  '0x123', // Odd length (should be even)
  '0xGHIJ', // Invalid characters
] as const

/**
 * Valid message strings for testing
 */
export const validMessages = [
  'Hello, World!',
  'This is a test message',
  'Special chars: !@#$%^&*()',
  'Unicode: 你好 🌍',
  'Multi\nline\nmessage',
  '', // Empty message (valid in some contexts)
] as const

/**
 * Invalid messages (context-dependent, but useful for edge cases)
 */
export const invalidMessages = [
  null,
  undefined,
] as const

/**
 * Valid private keys (for testing - NEVER use these in production!)
 */
export const validPrivateKeys = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
] as const

/**
 * Invalid private keys for testing
 */
export const invalidPrivateKeys = [
  '', // Empty
  '0x', // Too short
  '0x123', // Too short
  'not-a-key', // Invalid format
  '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', // Invalid chars
  'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Missing 0x
] as const

/**
 * Valid signature data
 */
export const validSignatures = [
  {
    r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    s: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    v: 27,
  },
  {
    r: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    s: '0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
    v: 28,
  },
] as const

/**
 * Transaction templates for testing
 */
export const validTransactions = [
  {
    to: validAddresses[0],
    value: '1000000000000000000', // 1 ETH in wei
    data: '0x',
  },
  {
    to: validAddresses[1],
    value: '0',
    data: validHexData[3],
  },
] as const
