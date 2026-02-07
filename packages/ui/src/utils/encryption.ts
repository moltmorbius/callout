/**
 * ECIES encryption for on-chain messages.
 * 
 * Uses secp256k1 ECIES - recipient decrypts with their private key.
 * Output is raw ciphertext with no prefix (minimal bytes on-chain).
 */

import { encrypt as eciesEncrypt, decrypt as eciesDecrypt, PublicKey, PrivateKey } from 'eciesjs'

/**
 * Encrypt a message using the recipient's public key (ECIES).
 * Returns raw hex ciphertext (no prefix).
 * 
 * @param message - Plaintext message
 * @param publicKeyHex - Uncompressed public key (0x04... 65 bytes)
 * @returns Raw ECIES ciphertext as hex string
 * @throws Error if public key is invalid or encryption fails
 */
export async function encryptMessage(message: string, publicKeyHex: string): Promise<string> {
  if (!message || message.trim().length === 0) {
    throw new Error('Message cannot be empty')
  }

  if (!publicKeyHex || publicKeyHex.trim().length === 0) {
    throw new Error('Public key is required for encryption')
  }

  try {
    // Remove 0x prefix if present and ensure it's uncompressed (starts with 04)
    let pubKeyBytes = publicKeyHex.startsWith('0x') ? publicKeyHex.slice(2) : publicKeyHex
    if (pubKeyBytes.startsWith('04')) {
      pubKeyBytes = pubKeyBytes.slice(2) // Remove 04 prefix for eciesjs
    }
    
    const publicKey = PublicKey.fromHex(pubKeyBytes)
    const encrypted = eciesEncrypt(publicKey.toHex(), Buffer.from(message, 'utf8'))
    
    // Return raw hex (no prefix)
    return encrypted.toString('hex')
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    throw new Error(`Encryption failed: ${errorMsg}. Verify the public key is valid and uncompressed.`)
  }
}

/**
 * Decrypt an ECIES-encrypted message using the recipient's private key.
 * 
 * @param encryptedHex - Raw ECIES ciphertext as hex string
 * @param privateKeyHex - Private key (32 bytes, with or without 0x prefix)
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (wrong key, corrupted data, etc.)
 */
export async function decryptMessage(encryptedHex: string, privateKeyHex: string): Promise<string> {
  if (!encryptedHex || encryptedHex.trim().length === 0) {
    throw new Error('Encrypted data is required')
  }

  if (!privateKeyHex || privateKeyHex.trim().length === 0) {
    throw new Error('Private key is required for decryption')
  }

  try {
    // Remove 0x prefix if present
    const hexData = encryptedHex.startsWith('0x') ? encryptedHex.slice(2) : encryptedHex
    const privKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex
    
    const encrypted = Buffer.from(hexData, 'hex')
    const privateKey = PrivateKey.fromHex(privKey)
    
    const decrypted = eciesDecrypt(privateKey.toHex(), encrypted)
    return decrypted.toString('utf8')
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    if (errorMsg.toLowerCase().includes('mac check failed') || errorMsg.toLowerCase().includes('authentication')) {
      throw new Error('Decryption failed: Wrong private key or corrupted data')
    }
    throw new Error(`Decryption failed: ${errorMsg}`)
  }
}

/**
 * Check if calldata looks like ECIES-encrypted data.
 * ECIES output is always >65 bytes (ephemeral pubkey + ciphertext + MAC).
 */
export function isEncrypted(hex: string): boolean {
  const data = hex.startsWith('0x') ? hex.slice(2) : hex
  // ECIES output: 33-byte ephemeral pubkey + 16-byte MAC + ciphertext
  // Minimum ~50 bytes, typically 100+
  return data.length >= 100 && /^[0-9a-fA-F]+$/.test(data)
}
