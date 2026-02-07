import { describe, it, expect } from 'vitest'
import { encodeMessage, decodeMessage, isLikelyText } from './index.js'

describe('encoding', () => {
  describe('encodeMessage', () => {
    it('should encode a simple message to hex', () => {
      const hex = encodeMessage('hello')
      expect(hex).toBe('0x68656c6c6f')
    })

    it('should encode unicode text', () => {
      const hex = encodeMessage('café')
      const decoded = decodeMessage(hex)
      expect(decoded).toBe('café')
    })

    it('should encode empty string', () => {
      const hex = encodeMessage('')
      expect(hex).toBe('0x')
    })
  })

  describe('decodeMessage', () => {
    it('should decode hex back to the original message', () => {
      const msg = decodeMessage('0x68656c6c6f')
      expect(msg).toBe('hello')
    })

    it('should round-trip arbitrary messages', () => {
      const original = 'Scammer stole 10 ETH from 0xabc...'
      const hex = encodeMessage(original)
      expect(decodeMessage(hex)).toBe(original)
    })
  })

  describe('isLikelyText', () => {
    it('should return true for printable ASCII hex', () => {
      const hex = encodeMessage('This is a callout message')
      expect(isLikelyText(hex)).toBe(true)
    })

    it('should return false for random binary data', () => {
      expect(isLikelyText('0xff00ff00ff00ff00')).toBe(false)
    })
  })
})
