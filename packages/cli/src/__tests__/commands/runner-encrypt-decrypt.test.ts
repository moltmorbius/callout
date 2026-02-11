/**
 * Tests for encrypt and decrypt command runners
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runCommand } from '../../commands/runner.js'
import { encryptMessage, decryptMessage } from '@callout/shared/encryption'
import { validatePublicKey } from '@callout/shared/validation'
import * as fs from 'node:fs'
import { validMessages, validPublicKeys, invalidPublicKeys, validPrivateKeys, invalidPrivateKeys } from '../helpers/fixtures.js'
import { Readable } from 'stream'

// Mock the file system
vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}))

// Mock the shared package functions
vi.mock('@callout/shared/encryption', () => ({
  encryptMessage: vi.fn(),
  decryptMessage: vi.fn(),
}))

vi.mock('@callout/shared/validation', () => ({
  validatePublicKey: vi.fn(),
  validateAddress: vi.fn(),
}))

/**
 * Helper to mock stdin with provided data
 */
function mockStdin(data: string): void {
  const stdin = new Readable({
    read() {
      this.push(data)
      this.push(null)
    },
  })
  
  // Replace process.stdin with our mock
  Object.defineProperty(process, 'stdin', {
    value: stdin,
    writable: true,
    configurable: true,
  })
}

describe('encrypt command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let originalStdin: typeof process.stdin

  beforeEach(() => {
    originalStdin = process.stdin
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit(${code})`)
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
      configurable: true,
    })
    vi.restoreAllMocks()
  })

  it('should encrypt a message with valid public key', async () => {
    const message = validMessages[0] // 'Hello, World!'
    const pubkey = validPublicKeys[0]
    const mockEncryptedHex = 'deadbeefcafe1234567890abcdef'
    
    vi.mocked(validatePublicKey).mockReturnValue({ isValid: true })
    vi.mocked(encryptMessage).mockResolvedValue(mockEncryptedHex)

    await runCommand('encrypt', { message, pubkey, chain: 1 })

    expect(validatePublicKey).toHaveBeenCalledWith(pubkey)
    expect(encryptMessage).toHaveBeenCalledWith(message, pubkey)
    expect(consoleLogSpy).toHaveBeenCalled()
    
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output).toEqual({
      command: 'encrypt',
      message,
      calldata: `0x${mockEncryptedHex}`,
      byteLength: mockEncryptedHex.length / 2,
      publicKey: pubkey,
    })
  })

  it('should handle invalid public key format with error', async () => {
    const message = validMessages[1]
    const invalidPubkey = invalidPublicKeys[3] // Too short pubkey (not empty)
    
    vi.mocked(validatePublicKey).mockReturnValue({ 
      isValid: false, 
      error: 'Public key must be a valid hex string' 
    })

    await expect(
      runCommand('encrypt', { message, pubkey: invalidPubkey, chain: 1 })
    ).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Public key must be a valid hex string'
    )
  })

  it('should handle missing public key with error', async () => {
    const message = validMessages[0]

    await expect(
      runCommand('encrypt', { message, chain: 1 })
    ).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: --pubkey (-k) is required for encrypt'
    )
  })

  it('should handle missing message with error', async () => {
    const pubkey = validPublicKeys[0]

    await expect(
      runCommand('encrypt', { pubkey, chain: 1 })
    ).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: --message (-m) is required for encrypt'
    )
  })

  it('should write encrypted output to file when --output is provided', async () => {
    const message = validMessages[2] // 'Special chars: !@#$%^&*()'
    const pubkey = validPublicKeys[1]
    const mockEncryptedHex = 'abcdef123456789'
    const outputPath = '/tmp/encrypted-output.json'
    
    vi.mocked(validatePublicKey).mockReturnValue({ isValid: true })
    vi.mocked(encryptMessage).mockResolvedValue(mockEncryptedHex)

    await runCommand('encrypt', { message, pubkey, output: outputPath, chain: 1 })

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      outputPath,
      expect.stringContaining('"command": "encrypt"'),
      'utf-8'
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(`Artifact written to ${outputPath}`)
  })

  it('should handle unicode and special characters in encrypted messages', async () => {
    const message = validMessages[3] // 'Unicode: 你好 🌍'
    const pubkey = validPublicKeys[0]
    const mockEncryptedHex = 'fedcba9876543210'
    
    vi.mocked(validatePublicKey).mockReturnValue({ isValid: true })
    vi.mocked(encryptMessage).mockResolvedValue(mockEncryptedHex)

    await runCommand('encrypt', { message, pubkey, chain: 1 })

    expect(encryptMessage).toHaveBeenCalledWith(message, pubkey)
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output.message).toBe(message)
  })

  it('should handle validation error without error message', async () => {
    const message = validMessages[0]
    const invalidPubkey = invalidPublicKeys[2]
    
    vi.mocked(validatePublicKey).mockReturnValue({ 
      isValid: false 
      // No error message provided
    })

    await expect(
      runCommand('encrypt', { message, pubkey: invalidPubkey, chain: 1 })
    ).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Invalid public key'
    )
  })
})

describe('decrypt command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let originalStdin: typeof process.stdin

  beforeEach(() => {
    originalStdin = process.stdin
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit(${code})`)
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
      configurable: true,
    })
    vi.restoreAllMocks()
  })

  it('should decrypt data with valid private key from stdin', async () => {
    const encryptedData = '0xdeadbeefcafe1234567890abcdef'
    const privateKey = validPrivateKeys[0]
    const decryptedMessage = 'Decrypted secret message'
    
    mockStdin(privateKey)
    vi.mocked(decryptMessage).mockResolvedValue(decryptedMessage)

    await runCommand('decrypt', { data: encryptedData, chain: 1 })

    expect(consoleErrorSpy).toHaveBeenCalledWith('Enter your private key (input is hidden):')
    expect(decryptMessage).toHaveBeenCalledWith(encryptedData.slice(2), privateKey)
    expect(consoleLogSpy).toHaveBeenCalled()
    
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output).toEqual({
      command: 'decrypt',
      calldata: encryptedData,
      message: decryptedMessage,
    })
  })

  it('should handle encrypted data without 0x prefix', async () => {
    const encryptedDataNoPrefix = 'abcdef1234567890'
    const expectedHex = 'abcdef1234567890'
    const privateKey = validPrivateKeys[1]
    const decryptedMessage = 'Another decrypted message'
    
    mockStdin(privateKey)
    vi.mocked(decryptMessage).mockResolvedValue(decryptedMessage)

    await runCommand('decrypt', { data: encryptedDataNoPrefix, chain: 1 })

    expect(decryptMessage).toHaveBeenCalledWith(expectedHex, privateKey)
    
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output.calldata).toBe(encryptedDataNoPrefix)
  })

  it('should handle invalid private key with error', async () => {
    const encryptedData = '0xdeadbeef'
    const invalidPrivKey = invalidPrivateKeys[3] // Invalid format (not empty)
    
    mockStdin(invalidPrivKey)
    vi.mocked(decryptMessage).mockRejectedValue(new Error('Invalid private key'))

    await expect(
      runCommand('decrypt', { data: encryptedData, chain: 1 })
    ).rejects.toThrow('Invalid private key')
  })

  it('should handle missing private key from stdin with error', async () => {
    const encryptedData = '0xdeadbeef'
    
    mockStdin('   ') // Whitespace only
    
    await expect(
      runCommand('decrypt', { data: encryptedData, chain: 1 })
    ).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Private key is required for decryption'
    )
  })

  it('should handle malformed encrypted data with error', async () => {
    const malformedData = '0xZZZZZZ' // Invalid hex
    const privateKey = validPrivateKeys[0]
    
    mockStdin(privateKey)
    vi.mocked(decryptMessage).mockRejectedValue(new Error('Invalid encrypted data format'))

    await expect(
      runCommand('decrypt', { data: malformedData, chain: 1 })
    ).rejects.toThrow('Invalid encrypted data format')
  })

  it('should handle missing --data flag with error', async () => {
    await expect(
      runCommand('decrypt', { chain: 1 })
    ).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: --data (-d) is required for decrypt'
    )
  })

  it('should write decrypted output to file when --output is provided', async () => {
    const encryptedData = '0x123456789abcdef'
    const privateKey = validPrivateKeys[0]
    const decryptedMessage = 'Secret file content'
    const outputPath = '/tmp/decrypted-output.json'
    
    mockStdin(privateKey)
    vi.mocked(decryptMessage).mockResolvedValue(decryptedMessage)

    await runCommand('decrypt', { data: encryptedData, output: outputPath, chain: 1 })

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      outputPath,
      expect.stringContaining('"command": "decrypt"'),
      'utf-8'
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(`Artifact written to ${outputPath}`)
  })

  it('should trim whitespace from private key input', async () => {
    const encryptedData = '0xfedcba'
    const privateKey = validPrivateKeys[0]
    const privateKeyWithWhitespace = `  ${privateKey}  \n`
    const decryptedMessage = 'Trimmed key test'
    
    mockStdin(privateKeyWithWhitespace)
    vi.mocked(decryptMessage).mockResolvedValue(decryptedMessage)

    await runCommand('decrypt', { data: encryptedData, chain: 1 })

    expect(decryptMessage).toHaveBeenCalledWith('fedcba', privateKey)
  })

  it('should handle decryption errors gracefully', async () => {
    const encryptedData = '0xbaddata'
    const privateKey = validPrivateKeys[0]
    
    mockStdin(privateKey)
    vi.mocked(decryptMessage).mockRejectedValue(new Error('Decryption failed: corrupted data'))

    await expect(
      runCommand('decrypt', { data: encryptedData, chain: 1 })
    ).rejects.toThrow('Decryption failed: corrupted data')
  })
})
