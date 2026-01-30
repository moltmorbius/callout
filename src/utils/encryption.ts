/**
 * Simple XOR-based "encryption" for demonstration.
 * 
 * For production, you'd use ECIES with the target's public key.
 * This module provides a placeholder that encodes messages with a shared secret
 * derived from a password/key the user provides.
 * 
 * The encrypted payload format:
 * [ENCRYPTED:v1:<base64-encrypted-data>]
 */

const ENCRYPTED_PREFIX = '[ENCRYPTED:v1:'
const ENCRYPTED_SUFFIX = ']'

/**
 * Encrypt a message using a passphrase (symmetric encryption via Web Crypto AES-GCM).
 */
export async function encryptMessage(message: string, passphrase: string): Promise<string> {
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
  return `${ENCRYPTED_PREFIX}${b64}${ENCRYPTED_SUFFIX}`
}

/**
 * Decrypt an encrypted message using the passphrase.
 */
export async function decryptMessage(encryptedPayload: string, passphrase: string): Promise<string> {
  if (!encryptedPayload.startsWith(ENCRYPTED_PREFIX) || !encryptedPayload.endsWith(ENCRYPTED_SUFFIX)) {
    throw new Error('Not an encrypted message (missing prefix/suffix)')
  }
  
  const b64 = encryptedPayload.slice(ENCRYPTED_PREFIX.length, -ENCRYPTED_SUFFIX.length)
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
 * Check if a decoded message appears to be encrypted.
 */
export function isEncryptedMessage(text: string): boolean {
  return text.startsWith(ENCRYPTED_PREFIX) && text.endsWith(ENCRYPTED_SUFFIX)
}
