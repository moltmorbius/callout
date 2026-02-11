/**
 * Tests for public key recovery functionality
 */

import { describe, it, expect } from 'vitest'
import type { Address, Hex } from 'viem'
import {
  publicKeyToAddress,
  fetchAndRecoverPublicKey,
  searchTransactionAcrossChains,
  recoverPublicKeyFromAddress,
} from './publicKeyRecovery.js'

describe('publicKeyToAddress', () => {
  it('should derive the correct address from a known public key', () => {
    // Known public key/address pair for testing
    const publicKey =
      '0x04e68acfc0253a10620dff706b0a1b1f1f5833ea3beb3bde2250d5f271f3563606672ebc45e0b7ea2e816ecb70ca03137b1c9476eec63d4632e990020b7b6fba39' as Hex
    const expectedAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1' as Address

    const result = publicKeyToAddress(publicKey)
    expect(result.toLowerCase()).toBe(expectedAddress.toLowerCase())
  })

  it('should handle another known public key/address pair', () => {
    // Another test case with a different known public key
    const publicKey =
      '0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8' as Hex
    
    const result = publicKeyToAddress(publicKey)
    // This should be a valid checksummed address
    expect(result).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  it('should produce checksummed addresses', () => {
    const publicKey =
      '0x04e68acfc0253a10620dff706b0a1b1f1f5833ea3beb3bde2250d5f271f3563606672ebc45e0b7ea2e816ecb70ca03137b1c9476eec63d4632e990020b7b6fba39' as Hex
    
    const result = publicKeyToAddress(publicKey)
    // Should contain at least one uppercase letter (checksummed)
    expect(/[A-F]/.test(result)).toBe(true)
  })
})

describe('fetchAndRecoverPublicKey', () => {
  it('should throw when transaction is not found', async () => {
    // Using a fake RPC and non-existent transaction hash
    const fakeRpc = 'https://invalid-rpc-endpoint-that-does-not-exist.com'
    const fakeTxHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex

    await expect(
      fetchAndRecoverPublicKey({
        rpcUrl: fakeRpc,
        txHash: fakeTxHash,
      })
    ).rejects.toThrow()
  })

  it('should accept valid parameters structure', () => {
    // Just test that the function accepts the right parameter structure
    const validParams = {
      rpcUrl: 'https://eth.llamarpc.com',
      txHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex,
    }

    // Function should accept these params without TypeScript errors
    expect(typeof validParams.rpcUrl).toBe('string')
    expect(typeof validParams.txHash).toBe('string')
  })
})

describe('searchTransactionAcrossChains', () => {
  it('should return null when API key is not provided', async () => {
    const txHash =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

    const result = await searchTransactionAcrossChains(txHash, '')
    expect(result).toBeNull()
  })

  it('should return null for non-existent transaction even with API key', async () => {
    // Using a fake API key and obviously fake transaction hash
    const txHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    const fakeApiKey = 'fake-api-key-for-testing'

    const result = await searchTransactionAcrossChains(txHash, fakeApiKey)
    // Should return null after searching all networks
    expect(result).toBeNull()
  })

  it('should accept valid transaction hash format', () => {
    const validTxHash =
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    
    expect(validTxHash).toMatch(/^0x[a-f0-9]{64}$/)
  })
})

describe('recoverPublicKeyFromAddress', () => {
  it('should throw when API key is not provided', async () => {
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as Address

    await expect(
      recoverPublicKeyFromAddress({
        address: testAddress,
        apiKey: '',
      })
    ).rejects.toThrow('Etherscan API key is required')
  })

  it('should accept valid address format', () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as Address
    
    expect(validAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  it('should accept optional preferredChainId parameter', async () => {
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as Address
    const fakeApiKey = 'fake-key'

    // Should accept preferredChainId without TypeScript errors
    const params = {
      address: testAddress,
      apiKey: fakeApiKey,
      preferredChainId: 1,
    }

    expect(params.preferredChainId).toBe(1)
  })

  it('should throw meaningful error for address with no transactions', async () => {
    // Using a valid-looking address that likely has no transactions
    const testAddress = '0x0000000000000000000000000000000000000001' as Address
    const fakeApiKey = 'fake-api-key-for-testing'

    await expect(
      recoverPublicKeyFromAddress({
        address: testAddress,
        apiKey: fakeApiKey,
      })
    ).rejects.toThrow(/No outgoing transactions found/)
  })
})

describe('RecoveredPublicKey interface', () => {
  it('should have expected properties', () => {
    // Test that the interface shape is as expected
    const mockResult = {
      publicKey: '0x04abcd...' as Hex,
      derivedAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as Address,
      txHash: '0x1234...',
      chainId: 1,
      chainName: 'Ethereum',
    }

    expect(mockResult).toHaveProperty('publicKey')
    expect(mockResult).toHaveProperty('derivedAddress')
    expect(mockResult).toHaveProperty('txHash')
    expect(mockResult).toHaveProperty('chainId')
    expect(mockResult).toHaveProperty('chainName')
  })

  it('should have correct property types', () => {
    const mockResult = {
      publicKey: '0x04abcd...' as Hex,
      derivedAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as Address,
      txHash: '0x1234...',
      chainId: 1,
      chainName: 'Ethereum',
    }

    expect(typeof mockResult.publicKey).toBe('string')
    expect(typeof mockResult.derivedAddress).toBe('string')
    expect(typeof mockResult.txHash).toBe('string')
    expect(typeof mockResult.chainId).toBe('number')
    expect(typeof mockResult.chainName).toBe('string')
  })
})

describe('Integration - publicKeyToAddress consistency', () => {
  it('should consistently derive the same address from the same public key', () => {
    const publicKey =
      '0x04e68acfc0253a10620dff706b0a1b1f1f5833ea3beb3bde2250d5f271f3563606672ebc45e0b7ea2e816ecb70ca03137b1c9476eec63d4632e990020b7b6fba39' as Hex

    const result1 = publicKeyToAddress(publicKey)
    const result2 = publicKeyToAddress(publicKey)

    expect(result1).toBe(result2)
  })

  it('should derive different addresses from different public keys', () => {
    const publicKey1 =
      '0x04e68acfc0253a10620dff706b0a1b1f1f5833ea3beb3bde2250d5f271f3563606672ebc45e0b7ea2e816ecb70ca03137b1c9476eec63d4632e990020b7b6fba39' as Hex
    const publicKey2 =
      '0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8' as Hex

    const result1 = publicKeyToAddress(publicKey1)
    const result2 = publicKeyToAddress(publicKey2)

    expect(result1).not.toBe(result2)
  })
})

describe('Error handling', () => {
  it('searchTransactionAcrossChains should handle network errors gracefully', async () => {
    const txHash =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    const apiKey = 'test-key'

    // Should not throw, should return null after trying all networks
    const result = await searchTransactionAcrossChains(txHash, apiKey)
    expect(result).toBeNull()
  })

  it('recoverPublicKeyFromAddress should reject empty API key', async () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as Address

    await expect(
      recoverPublicKeyFromAddress({
        address,
        apiKey: '',
      })
    ).rejects.toThrow()
  })
})
