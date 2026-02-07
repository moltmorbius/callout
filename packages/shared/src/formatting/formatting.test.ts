import { describe, it, expect } from 'vitest'
import { truncateAddress, truncateMessage, formatTokenAmount } from './index.js'

describe('formatting', () => {
  describe('truncateAddress', () => {
    it('should truncate a standard address', () => {
      const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbE'
      expect(truncateAddress(addr)).toBe('0x742d…bEbE')
    })

    it('should allow custom prefix and suffix lengths', () => {
      const addr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbE'
      expect(truncateAddress(addr, 10, 6)).toBe('0x742d35Cc…f0bEbE')
    })

    it('should return the full string if shorter than prefix + suffix', () => {
      expect(truncateAddress('0xABCD', 6, 4)).toBe('0xABCD')
    })
  })

  describe('truncateMessage', () => {
    it('should not truncate short messages', () => {
      expect(truncateMessage('hello')).toBe('hello')
    })

    it('should truncate at the given max length', () => {
      const msg = 'a'.repeat(250)
      const result = truncateMessage(msg, 200)
      expect(result.length).toBeLessThanOrEqual(201) // 200 + ellipsis char
      expect(result.endsWith('…')).toBe(true)
    })
  })

  describe('formatTokenAmount', () => {
    it('should format native ETH (wei to ether)', () => {
      expect(formatTokenAmount('1000000000000000000', 18, 'native')).toBe('1')
    })

    it('should format native ETH with fractional part', () => {
      expect(formatTokenAmount('1500000000000000000', 18, 'native')).toBe('1.5')
    })

    it('should format ERC20 with custom decimals', () => {
      expect(formatTokenAmount('1000000', 6, 'erc20')).toBe('1')
    })

    it('should return value as-is for ERC721', () => {
      expect(formatTokenAmount('42', undefined, 'erc721')).toBe('42')
    })

    it('should return value as-is for ERC1155', () => {
      expect(formatTokenAmount('1', undefined, 'erc1155')).toBe('1')
    })

    it('should default to 18 decimals for native type', () => {
      expect(formatTokenAmount('2000000000000000000', undefined, 'native')).toBe('2')
    })
  })
})
