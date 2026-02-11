/**
 * Tests for encode and decode command runners
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runCommand } from '../../commands/runner.js'
import { encodeMessage, decodeMessage } from '@callout/shared/encoding'
import { isEncrypted } from '@callout/shared/encryption'
import * as fs from 'node:fs'
import { validMessages } from '../helpers/fixtures.js'

// Mock the file system
vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}))

// Mock the shared package functions
vi.mock('@callout/shared/encoding', () => ({
  encodeMessage: vi.fn(),
  decodeMessage: vi.fn(),
}))

vi.mock('@callout/shared/encryption', () => ({
  isEncrypted: vi.fn(),
}))

describe('encode command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit(${code})`)
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should encode a valid message', async () => {
    const message = validMessages[0] // 'Hello, World!'
    const mockCalldata = '0xdeadbeef'
    
    vi.mocked(encodeMessage).mockReturnValue(mockCalldata)

    await runCommand('encode', { message, chain: 1 })

    expect(encodeMessage).toHaveBeenCalledWith(message)
    expect(consoleLogSpy).toHaveBeenCalled()
    
    // Verify the output structure
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output).toEqual({
      command: 'encode',
      message,
      calldata: mockCalldata,
      byteLength: (mockCalldata.length - 2) / 2,
    })
  })

  it('should handle empty message with error', async () => {
    await expect(
      runCommand('encode', { chain: 1 })
    ).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: --message (-m) is required for encode'
    )
  })

  it('should write output to file when --output is provided', async () => {
    const message = validMessages[1] // 'This is a test message'
    const mockCalldata = '0x123456'
    const outputPath = '/tmp/test-output.json'
    
    vi.mocked(encodeMessage).mockReturnValue(mockCalldata)

    await runCommand('encode', { message, output: outputPath, chain: 1 })

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      outputPath,
      expect.stringContaining('"command": "encode"'),
      'utf-8'
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(`Artifact written to ${outputPath}`)
  })

  it('should handle special characters and unicode in messages', async () => {
    const message = validMessages[3] // 'Unicode: 你好 🌍'
    const mockCalldata = '0xabcdef'
    
    vi.mocked(encodeMessage).mockReturnValue(mockCalldata)

    await runCommand('encode', { message, chain: 1 })

    expect(encodeMessage).toHaveBeenCalledWith(message)
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output.message).toBe(message)
  })

  it('should handle multiline messages', async () => {
    const message = validMessages[4] // 'Multi\nline\nmessage'
    const mockCalldata = '0x999999'
    
    vi.mocked(encodeMessage).mockReturnValue(mockCalldata)

    await runCommand('encode', { message, chain: 1 })

    expect(encodeMessage).toHaveBeenCalledWith(message)
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output.message).toBe(message)
  })
})

describe('decode command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit(${code})`)
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should decode valid hex data', async () => {
    const data = '0xdeadbeef'
    const mockMessage = 'Decoded message'
    
    vi.mocked(decodeMessage).mockReturnValue(mockMessage)
    vi.mocked(isEncrypted).mockReturnValue(false)

    await runCommand('decode', { data, chain: 1 })

    expect(decodeMessage).toHaveBeenCalledWith(data)
    expect(isEncrypted).toHaveBeenCalledWith(data)
    
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output).toEqual({
      command: 'decode',
      calldata: data,
      message: mockMessage,
      encrypted: false,
    })
  })

  it('should handle hex data without 0x prefix', async () => {
    const dataWithoutPrefix = 'deadbeef'
    const expectedHex = '0xdeadbeef'
    const mockMessage = 'Decoded message'
    
    vi.mocked(decodeMessage).mockReturnValue(mockMessage)
    vi.mocked(isEncrypted).mockReturnValue(false)

    await runCommand('decode', { data: dataWithoutPrefix, chain: 1 })

    expect(decodeMessage).toHaveBeenCalledWith(expectedHex)
    expect(isEncrypted).toHaveBeenCalledWith(expectedHex)
    
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output.calldata).toBe(expectedHex)
  })

  it('should detect encrypted data and show appropriate message', async () => {
    const encryptedData = '0xencryptedstuff'
    
    vi.mocked(isEncrypted).mockReturnValue(true)

    await runCommand('decode', { data: encryptedData, chain: 1 })

    expect(isEncrypted).toHaveBeenCalledWith(encryptedData)
    
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output).toEqual({
      command: 'decode',
      calldata: encryptedData,
      message: '[encrypted — use decrypt command]',
      encrypted: true,
    })
  })

  it('should require --data flag', async () => {
    await expect(
      runCommand('decode', { chain: 1 })
    ).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: --data (-d) is required for decode'
    )
  })

  it('should write output to file when --output is provided', async () => {
    const data = '0x123456'
    const mockMessage = 'File output test'
    const outputPath = '/tmp/decode-output.json'
    
    vi.mocked(decodeMessage).mockReturnValue(mockMessage)
    vi.mocked(isEncrypted).mockReturnValue(false)

    await runCommand('decode', { data, output: outputPath, chain: 1 })

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      outputPath,
      expect.stringContaining('"command": "decode"'),
      'utf-8'
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(`Artifact written to ${outputPath}`)
  })

  it('should handle empty hex data gracefully', async () => {
    const data = '0x'
    const mockMessage = ''
    
    vi.mocked(decodeMessage).mockReturnValue(mockMessage)
    vi.mocked(isEncrypted).mockReturnValue(false)

    await runCommand('decode', { data, chain: 1 })

    expect(decodeMessage).toHaveBeenCalledWith(data)
    
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0])
    expect(output.message).toBe(mockMessage)
  })
})
