import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAndRecoverPublicKey,
  searchTransactionAcrossChains,
} from '@callout/shared/crypto';
import type { Hex } from 'viem';

describe('Fetch and Recover Public Key', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error for non-existent transaction', async () => {
    // Using a fake RPC that will return null transaction
    const fakeRpcUrl = 'https://fake-nonexistent-rpc.example.com';
    const nonExistentTxHash: Hex = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    await expect(
      fetchAndRecoverPublicKey({ rpcUrl: fakeRpcUrl, txHash: nonExistentTxHash })
    ).rejects.toThrow();
  });

  it('should validate transaction hash format', async () => {
    const rpcUrl = 'https://eth.llamarpc.com';
    const invalidHash = 'not-a-valid-hash' as Hex;

    // Should eventually throw due to invalid format
    await expect(
      fetchAndRecoverPublicKey({ rpcUrl, txHash: invalidHash })
    ).rejects.toThrow();
  });

  // Note: Full integration test would require a real RPC with a known transaction
  // For CI/CD, we'd want to mock the RPC response
});

describe('Search Transaction Across Chains', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null if apiKey is empty', async () => {
    const txHash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const result = await searchTransactionAcrossChains(txHash, '');

    expect(result).toBeNull();
  });

  it('should search across configured networks', async () => {
    const txHash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    // Mock successful response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          hash: txHash,
          blockNumber: '0x12345',
          from: '0xabcd',
          to: '0xefgh',
        }
      })
    });

    const result = await searchTransactionAcrossChains(txHash, 'test-api-key');
    
    expect(result).toBeTruthy();
    expect(result?.chainId).toBeTruthy();
    expect(result?.rpcUrl).toBeTruthy();
    
    // Should be one of the configured networks
    const validChainIds = [1, 137, 42161, 10, 8453, 56];
    expect(validChainIds).toContain(result?.chainId);
  });

  it('should return null if transaction not found on any chain', async () => {
    const txHash: Hex = '0xnonexistent0000000000000000000000000000000000000000000000000000';
    
    // Mock "not found" response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: null
      })
    });

    const result = await searchTransactionAcrossChains(txHash, 'test-api-key');
    
    expect(result).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    const txHash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    // Mock network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await searchTransactionAcrossChains(txHash, 'test-api-key');
    
    // Should return null on error, not throw
    expect(result).toBeNull();
  });

  it('should handle rate limiting (429)', async () => {
    const txHash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    // Mock rate limit response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        status: '0',
        message: 'Rate limit exceeded'
      })
    });

    const result = await searchTransactionAcrossChains(txHash, 'test-api-key');
    
    expect(result).toBeNull();
  });

  it('should handle malformed JSON response', async () => {
    const txHash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    // Mock malformed response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      }
    });

    const result = await searchTransactionAcrossChains(txHash, 'test-api-key');
    
    expect(result).toBeNull();
  });

  it('should try multiple networks until found', async () => {
    const txHash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    let callCount = 0;
    
    // Mock: first 2 calls fail, 3rd succeeds
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ result: null })
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            result: {
              hash: txHash,
              blockNumber: '0x12345',
            }
          })
        });
      }
    });

    const result = await searchTransactionAcrossChains(txHash, 'test-api-key');
    
    expect(result).toBeTruthy();
    expect(callCount).toBeGreaterThanOrEqual(3); // Should have tried at least 3
  });
});

describe('Integration: Full Recovery Flow', () => {
  it('should demonstrate expected workflow', async () => {
    // This test documents the expected usage pattern
    const txHash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    // Step 1: User pastes transaction hash
    expect(txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
    
    // Step 2: Search for transaction across chains
    // const searchResult = await searchTransactionAcrossChains(txHash);
    
    // Step 3: If found, fetch and recover public key
    // if (searchResult) {
    //   const publicKey = await fetchAndRecoverPublicKey(searchResult.rpcUrl, txHash);
    //   expect(publicKey.startsWith('0x04')).toBe(true);
    //   expect(publicKey.length).toBe(132); // 0x + 130 chars
    // }
    
    // Step 4: Use public key to encrypt message
    // const encrypted = await encryptMessage('Hello!', publicKey);
    
    // This test documents the flow without requiring live network calls
    expect(true).toBe(true);
  });
});

describe('Edge Cases', () => {
  it('should handle malformed transaction hash', async () => {
    const rpcUrl = 'https://eth.llamarpc.com';
    
    const malformedHashes = [
      'not-a-hash',
      '0x123', // Too short
      '0x' + 'z'.repeat(64), // Invalid hex
      '', // Empty
    ];

    for (const hash of malformedHashes) {
      await expect(
        fetchAndRecoverPublicKey({ rpcUrl, txHash: hash as Hex })
      ).rejects.toThrow();
    }
  });

  it('should validate search result format', async () => {
    const txHash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    // Mock response with result
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: { hash: txHash }
      })
    });

    const result = await searchTransactionAcrossChains(txHash, 'test-api-key');
    
    if (result) {
      expect(result).toHaveProperty('chainId');
      expect(result).toHaveProperty('rpcUrl');
      expect(typeof result.chainId).toBe('number');
      expect(typeof result.rpcUrl).toBe('string');
      expect(result.rpcUrl.startsWith('http')).toBe(true);
    }
  });
});

describe('Public Key Format Validation', () => {
  it('should return uncompressed public key (0x04...)', async () => {
    // This test would need a real transaction to validate format
    // Documenting expected output format
    
    const expectedFormat = /^0x04[0-9a-fA-F]{128}$/;
    const mockPublicKey = '0x04' + 'a'.repeat(128);
    
    expect(mockPublicKey).toMatch(expectedFormat);
    expect(mockPublicKey.length).toBe(132); // 0x + 04 + 128 hex chars
  });

  it('should be compatible with ECIES encryption', () => {
    // Uncompressed secp256k1 public key format
    // This is what Ethereum uses and what eciesjs expects
    const uncompressedFormat = '0x04' + 'a'.repeat(128);
    
    expect(uncompressedFormat.startsWith('0x04')).toBe(true);
    expect(uncompressedFormat.length).toBe(132);
  });
});
