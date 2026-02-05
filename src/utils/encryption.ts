/**
 * Encryption utilities for on-chain messages.
 * 
 * Supports two modes:
 * 1. Public key encryption (ECIES) - recipient can decrypt with their private key
 * 2. Passphrase encryption (AES-GCM) - shared secret
 * 
 * Format:
 * - Public key: ENC:PUBKEY:v1:<base64-encrypted-data>
 * - Passphrase: ENC:PASS:v1:<base64-encrypted-data>
 */

import { encrypt as eciesEncrypt, decrypt as eciesDecrypt, PublicKey } from 'eciesjs'

const PUBKEY_PREFIX = 'ENC:PUBKEY:v1:'
const PASSPHRASE_PREFIX = 'ENC:PASS:v1:'

// Legacy prefix for backward compatibility
const LEGACY_PREFIX = '[ENCRYPTED:v1:'
const LEGACY_SUFFIX = ']'

/**
 * Encrypt a message using the recipient's public key (ECIES).
 * The recipient can decrypt with their private key.
 * 
 * @param message - Plaintext message
 * @param publicKeyHex - Uncompressed public key (0x04... 65 bytes)
 * @returns Encrypted message with prefix
 */
export async function encryptWithPublicKey(message: string, publicKeyHex: string): Promise<string> {
  // Remove 0x prefix if present and ensure it's uncompressed (starts with 04)
  let pubKeyBytes = publicKeyHex.startsWith('0x') ? publicKeyHex.slice(2) : publicKeyHex
  if (pubKeyBytes.startsWith('04')) {
    pubKeyBytes = pubKeyBytes.slice(2) // Remove 04 prefix for eciesjs
  }
  
  const publicKey = PublicKey.fromHex(pubKeyBytes)
  const encrypted = eciesEncrypt(publicKey.toHex(), Buffer.from(message, 'utf8'))
  
  const b64 = encrypted.toString('base64')
  return `${PUBKEY_PREFIX}${b64}`
}

/**
 * Encrypt a message using a passphrase (symmetric encryption via Web Crypto AES-GCM).
 */
export async function encryptWithPassphrase(message: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(message)
  )
  
  // Pack salt + iv + ciphertext
  const packed = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length)
  packed.set(salt, 0)
  packed.set(iv, salt.length)
  packed.set(new Uint8Array(ciphertext), salt.length + iv.length)
  
  const b64 = btoa(String.fromCharCode(...packed))
  return `${PASSPHRASE_PREFIX}${b64}`
}

/**
 * Legacy encryption function (for backward compatibility).
 * New code should use encryptWithPassphrase or encryptWithPublicKey.
 */
export async function encryptMessage(message: string, passphrase: string): Promise<string> {
  return encryptWithPassphrase(message, passphrase)
}

/**
 * Decrypt a public-key encrypted message using the recipient's private key.
 * 
 * @param encryptedPayload - Encrypted message with ENC:PUBKEY:v1: prefix
 * @param privateKeyHex - Private key (32 bytes, with or without 0x prefix)
 * @returns Decrypted plaintext
 */
export async function decryptWithPrivateKey(encryptedPayload: string, privateKeyHex: string): Promise<string> {
  if (!encryptedPayload.startsWith(PUBKEY_PREFIX)) {
    throw new Error('Not a public-key encrypted message')
  }
  
  const b64 = encryptedPayload.slice(PUBKEY_PREFIX.length)
  const encrypted = Buffer.from(b64, 'base64')
  
  // Remove 0x prefix if present
  const privKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex
  
  const decrypted = eciesDecrypt(privKey, encrypted)
  return decrypted.toString('utf8')
}

/**
 * Decrypt a passphrase-encrypted message.
 * Supports both new (ENC:PASS:v1:) and legacy ([ENCRYPTED:v1:]) formats.
 * 
 * @param encryptedPayload - Encrypted message
 * @param passphrase - Decryption passphrase
 * @returns Decrypted plaintext
 */
export async function decryptWithPassphrase(encryptedPayload: string, passphrase: string): Promise<string> {
  let b64: string
  
  // Handle new format
  if (encryptedPayload.startsWith(PASSPHRASE_PREFIX)) {
    b64 = encryptedPayload.slice(PASSPHRASE_PREFIX.length)
  }
  // Handle legacy format
  else if (encryptedPayload.startsWith(LEGACY_PREFIX) && encryptedPayload.endsWith(LEGACY_SUFFIX)) {
    b64 = encryptedPayload.slice(LEGACY_PREFIX.length, -LEGACY_SUFFIX.length)
  }
  else {
    throw new Error('Not a passphrase-encrypted message')
  }
  
  const packed = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  
  const salt = packed.slice(0, 16)
  const iv = packed.slice(16, 28)
  const ciphertext = packed.slice(28)
  
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  
  return new TextDecoder().decode(plaintext)
}

/**
 * Legacy decryption function (for backward compatibility).
 * Auto-detects format and decrypts using passphrase.
 */
export async function decryptMessage(encryptedPayload: string, passphrase: string): Promise<string> {
  return decryptWithPassphrase(encryptedPayload, passphrase)
}

/**
 * Check if a decoded message appears to be encrypted.
 * Detects both public-key and passphrase encryption (new and legacy formats).
 */
export function isEncryptedMessage(text: string): boolean {
  return (
    text.startsWith(PUBKEY_PREFIX) ||
    text.startsWith(PASSPHRASE_PREFIX) ||
    (text.startsWith(LEGACY_PREFIX) && text.endsWith(LEGACY_SUFFIX))
  )
}

/**
 * Detect the encryption type of a message.
 * Returns 'pubkey', 'passphrase', 'legacy', or null if not encrypted.
 */
export function getEncryptionType(text: string): 'pubkey' | 'passphrase' | 'legacy' | null {
  if (text.startsWith(PUBKEY_PREFIX)) return 'pubkey'
  if (text.startsWith(PASSPHRASE_PREFIX)) return 'passphrase'
  if (text.startsWith(LEGACY_PREFIX) && text.endsWith(LEGACY_SUFFIX)) return 'legacy'
  return null
}
