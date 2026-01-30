import { describe, it, expect } from 'vitest'
import { encryptMessage, decryptMessage, isEncryptedMessage } from './encryption'

describe('encryptMessage / decryptMessage (AES-GCM)', () => {
  it('encrypts and decrypts a simple message', async () => {
    const passphrase = 'supersecret'
    const message = 'Return my funds!'

    const encrypted = await encryptMessage(message, passphrase)
    const decrypted = await decryptMessage(encrypted, passphrase)

    expect(decrypted).toBe(message)
  })

  it('produces output with the expected prefix/suffix', async () => {
    const encrypted = await encryptMessage('test', 'pass')
    expect(encrypted.startsWith('[ENCRYPTED:v1:')).toBe(true)
    expect(encrypted.endsWith(']')).toBe(true)
  })

  it('produces different ciphertext on each call (random salt/IV)', async () => {
    const msg = 'same message'
    const pass = 'samepass'
    const e1 = await encryptMessage(msg, pass)
    const e2 = await encryptMessage(msg, pass)

    // Both decrypt to the same thing
    expect(await decryptMessage(e1, pass)).toBe(msg)
    expect(await decryptMessage(e2, pass)).toBe(msg)

    // But the encrypted payloads differ (different random salt + IV)
    expect(e1).not.toBe(e2)
  })

  it('fails to decrypt with wrong passphrase', async () => {
    const encrypted = await encryptMessage('secret data', 'correct-pass')

    await expect(
      decryptMessage(encrypted, 'wrong-pass')
    ).rejects.toThrow()
  })

  it('handles empty message', async () => {
    const encrypted = await encryptMessage('', 'pass')
    const decrypted = await decryptMessage(encrypted, 'pass')
    expect(decrypted).toBe('')
  })

  it('handles multi-byte UTF-8 in message', async () => {
    const msg = '🔥 Stolen funds tracked! こんにちは'
    const encrypted = await encryptMessage(msg, 'pass123')
    const decrypted = await decryptMessage(encrypted, 'pass123')
    expect(decrypted).toBe(msg)
  })

  it('handles special characters in passphrase', async () => {
    const msg = 'test'
    const pass = '🔑p@$$w0rd!#%&*'
    const encrypted = await encryptMessage(msg, pass)
    const decrypted = await decryptMessage(encrypted, pass)
    expect(decrypted).toBe(msg)
  })

  it('throws on invalid encrypted payload format', async () => {
    await expect(
      decryptMessage('not-encrypted', 'pass')
    ).rejects.toThrow('Not an encrypted message')
  })

  it('throws on truncated payload', async () => {
    const encrypted = await encryptMessage('test', 'pass')
    const truncated = encrypted.slice(0, 30) + ']'

    await expect(
      decryptMessage(truncated, 'pass')
    ).rejects.toThrow()
  })
})

describe('isEncryptedMessage', () => {
  it('returns true for encrypted messages', async () => {
    const encrypted = await encryptMessage('hello', 'key')
    expect(isEncryptedMessage(encrypted)).toBe(true)
  })

  it('returns false for plain text', () => {
    expect(isEncryptedMessage('Hello world')).toBe(false)
  })

  it('returns false for partial prefix only', () => {
    expect(isEncryptedMessage('[ENCRYPTED:v1:')).toBe(false) // missing suffix
  })

  it('returns false for empty string', () => {
    expect(isEncryptedMessage('')).toBe(false)
  })
})
