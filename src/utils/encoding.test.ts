import { describe, it, expect } from 'vitest'
import { encodeMessage, decodeMessage, isLikelyText } from './encoding'

describe('encodeMessage', () => {
  it('encodes an ASCII string to hex', () => {
    const hex = encodeMessage('Hello')
    expect(hex).toBe('0x48656c6c6f')
  })

  it('returns a 0x-prefixed hex string', () => {
    const hex = encodeMessage('A')
    expect(hex.startsWith('0x')).toBe(true)
  })

  it('encodes an empty string', () => {
    const hex = encodeMessage('')
    expect(hex).toBe('0x')
  })

  it('encodes multi-byte UTF-8 characters (emoji)', () => {
    const hex = encodeMessage('🔥')
    // '🔥' is U+1F525 → UTF-8 bytes: f0 9f 94 a5
    expect(hex).toBe('0xf09f94a5')
  })

  it('encodes a longer message with round-trip', () => {
    const msg = 'Return funds to 0xdead...beef immediately.'
    const hex = encodeMessage(msg)
    expect(hex.length).toBeGreaterThan(2) // more than just "0x"
    expect(decodeMessage(hex)).toBe(msg)
  })
})

describe('decodeMessage', () => {
  it('decodes hex back to the original string', () => {
    const original = 'Hello, blockchain!'
    const hex = encodeMessage(original)
    expect(decodeMessage(hex)).toBe(original)
  })

  it('decodes known hex value', () => {
    expect(decodeMessage('0x48656c6c6f')).toBe('Hello')
  })

  it('handles empty hex (0x)', () => {
    expect(decodeMessage('0x')).toBe('')
  })

  it('round-trips Unicode correctly', () => {
    const original = 'こんにちは世界 🌍'
    const hex = encodeMessage(original)
    expect(decodeMessage(hex)).toBe(original)
  })

  it('round-trips a message with newlines', () => {
    const original = 'Line 1\nLine 2\nLine 3'
    const hex = encodeMessage(original)
    expect(decodeMessage(hex)).toBe(original)
  })
})

describe('isLikelyText', () => {
  it('returns true for printable ASCII text', () => {
    const hex = encodeMessage('Hello World')
    expect(isLikelyText(hex)).toBe(true)
  })

  it('returns true for text with some non-ASCII (mixed)', () => {
    const hex = encodeMessage('Hello World! Mostly ASCII with café')
    expect(isLikelyText(hex)).toBe(true)
  })

  it('returns false for binary-looking data', () => {
    // Construct hex that decodes to mostly non-printable bytes
    const binaryHex = '0x0001020304050607080b0c0e0f101112131415161718191a1b1c1d1e1f' as `0x${string}`
    expect(isLikelyText(binaryHex)).toBe(false)
  })

  it('returns true for text with tabs and newlines', () => {
    const hex = encodeMessage('Hello\tWorld\nNew line')
    // tabs and newlines are stripped by the printable regex, but the
    // 80% threshold should still pass since most chars are printable
    expect(isLikelyText(hex)).toBe(true)
  })
})
