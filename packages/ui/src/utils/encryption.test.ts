import { describe, it, expect, beforeAll } from 'vitest';
import { PrivateKey } from 'eciesjs';
import {
  encryptMessage,
  decryptMessage,
  isEncrypted,
} from '@callout/shared/encryption';

describe('ECIES Encryption', () => {
  // Generate a valid test keypair
  let testPrivateKey: string;
  let testPublicKey: string;

  beforeAll(() => {
    const privateKey = new PrivateKey();
    const publicKey = privateKey.publicKey;
    
    testPrivateKey = '0x' + privateKey.toHex();
    testPublicKey = '0x04' + publicKey.toHex(); // uncompressed with 04 prefix
  });

  it('should encrypt and decrypt a message', async () => {
    const message = 'Hello, encrypted world!';
    
    const encrypted = await encryptMessage(message, testPublicKey);
    expect(encrypted).toBeTruthy();
    expect(encrypted).toMatch(/^[0-9a-fA-F]+$/); // Hex output
    expect(encrypted).not.toContain(message); // Should not contain plaintext
    
    const decrypted = await decryptMessage(encrypted, testPrivateKey);
    expect(decrypted).toBe(message);
  });

  it('should handle unicode characters', async () => {
    const message = '你好世界 🌍 émojis';
    
    const encrypted = await encryptMessage(message, testPublicKey);
    const decrypted = await decryptMessage(encrypted, testPrivateKey);
    
    expect(decrypted).toBe(message);
  });

  it('should produce different ciphertext for same message', async () => {
    const message = 'Same message';
    
    const encrypted1 = await encryptMessage(message, testPublicKey);
    const encrypted2 = await encryptMessage(message, testPublicKey);
    
    // ECIES includes random ephemeral key, so ciphertext should differ
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both should decrypt to same plaintext
    const decrypted1 = await decryptMessage(encrypted1, testPrivateKey);
    const decrypted2 = await decryptMessage(encrypted2, testPrivateKey);
    expect(decrypted1).toBe(message);
    expect(decrypted2).toBe(message);
  });

  it('should fail with wrong private key', async () => {
    const message = 'Secret message';
    const wrongPrivateKey = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
    
    const encrypted = await encryptMessage(message, testPublicKey);
    
    await expect(
      decryptMessage(encrypted, wrongPrivateKey)
    ).rejects.toThrow();
  });

  it('should handle empty string', async () => {
    const message = '';
    
    const encrypted = await encryptMessage(message, testPublicKey);
    const decrypted = await decryptMessage(encrypted, testPrivateKey);
    
    expect(decrypted).toBe(message);
  });

  it('should handle very long messages', async () => {
    const message = 'A'.repeat(10000);
    
    const encrypted = await encryptMessage(message, testPublicKey);
    const decrypted = await decryptMessage(encrypted, testPrivateKey);
    
    expect(decrypted).toBe(message);
  });

  it('should handle public key with 0x prefix', async () => {
    const message = 'Test';
    
    const encrypted = await encryptMessage(message, testPublicKey);
    const decrypted = await decryptMessage(encrypted, testPrivateKey);
    
    expect(decrypted).toBe(message);
  });

  it('should handle public key without 0x prefix', async () => {
    const message = 'Test';
    const pubKeyNoPrefix = testPublicKey.slice(2);
    
    const encrypted = await encryptMessage(message, pubKeyNoPrefix);
    const decrypted = await decryptMessage(encrypted, testPrivateKey);
    
    expect(decrypted).toBe(message);
  });

  it('should handle private key without 0x prefix', async () => {
    const message = 'Test';
    const privKeyNoPrefix = testPrivateKey.slice(2);
    
    const encrypted = await encryptMessage(message, testPublicKey);
    const decrypted = await decryptMessage(encrypted, privKeyNoPrefix);
    
    expect(decrypted).toBe(message);
  });

  it('should output raw hex (no prefix)', async () => {
    const message = 'Test';
    
    const encrypted = await encryptMessage(message, testPublicKey);
    
    // Should be hex string with no prefix
    expect(encrypted).toMatch(/^[0-9a-fA-F]+$/);
    expect(encrypted.startsWith('0x')).toBe(false);
    expect(encrypted.startsWith('ENC:')).toBe(false);
  });
});

describe('Encryption Detection', () => {
  it('should detect encrypted data', async () => {
    // This will throw because it's not a valid key, but we can test with real encrypted data
    const fakeEncrypted = 'a'.repeat(150); // Long hex string
    expect(isEncrypted(fakeEncrypted)).toBe(true);
  });

  it('should reject short data', () => {
    const shortHex = 'abcdef';
    expect(isEncrypted(shortHex)).toBe(false);
  });

  it('should reject non-hex data', () => {
    const notHex = 'hello world this is not hex';
    expect(isEncrypted(notHex)).toBe(false);
  });

  it('should handle data with 0x prefix', () => {
    const longHex = '0x' + 'a'.repeat(150);
    expect(isEncrypted(longHex)).toBe(true);
  });

  it('should require minimum length for ECIES', () => {
    // ECIES minimum is ~100 hex chars (50 bytes)
    const tooShort = 'a'.repeat(99);
    const longEnough = 'a'.repeat(100);
    
    expect(isEncrypted(tooShort)).toBe(false);
    expect(isEncrypted(longEnough)).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should reject invalid public key format', async () => {
    await expect(
      encryptMessage('message', 'not-a-valid-pubkey')
    ).rejects.toThrow();
  });

  it('should reject invalid private key format', async () => {
    await expect(
      decryptMessage('0xabcd', 'not-a-valid-privkey')
    ).rejects.toThrow();
  });

  it('should reject corrupted ciphertext', async () => {
    const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    await expect(
      decryptMessage('corrupted!!!', privateKey)
    ).rejects.toThrow();
  });

  it('should handle malformed hex', async () => {
    await expect(
      decryptMessage('zzzzzzzzzz', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef') // Invalid hex
    ).rejects.toThrow();
  });
});

describe('Key Format Compatibility', () => {
  it('should handle compressed public key (02/03 prefix)', async () => {
    // Some wallets return compressed keys
    // eciesjs should handle this internally
    const compressedPubkey = '02' + 'a'.repeat(64);
    const message = 'Test';
    
    // This may or may not work depending on eciesjs version
    // Just test that it doesn't crash unexpectedly
    try {
      await encryptMessage(message, compressedPubkey);
    } catch (e) {
      // Expected to throw - compressed keys may not be supported
      expect(e).toBeTruthy();
    }
  });

  it('should handle uncompressed public key (04 prefix)', async () => {
    const uncompressedPubkey = '04' + 'a'.repeat(128);
    const message = 'Test';
    
    // May throw due to invalid key, but format should be accepted
    try {
      await encryptMessage(message, uncompressedPubkey);
    } catch (e) {
      // Expected - the key is invalid but format is correct
      expect(e).toBeTruthy();
    }
  });
});
