import { describe, it, expect } from 'vitest'
import { isAddress } from 'viem'

/**
 * Tests for Ethereum address validation via viem.
 * The app uses isAddress from viem in MessageComposer — verify its behavior.
 */
describe('isAddress (viem)', () => {
  it('accepts a valid checksummed address', () => {
    expect(isAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(true)
  })

  it('accepts a valid lowercase address', () => {
    expect(isAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(true)
  })

  it('accepts the zero address', () => {
    expect(isAddress('0x0000000000000000000000000000000000000000')).toBe(true)
  })

  it('rejects an address that is too short', () => {
    expect(isAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa9604')).toBe(false)
  })

  it('rejects an address that is too long', () => {
    expect(isAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa960450')).toBe(false)
  })

  it('rejects a non-hex string', () => {
    expect(isAddress('not-an-address')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isAddress('')).toBe(false)
  })

  it('rejects address without 0x prefix', () => {
    expect(isAddress('d8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(false)
  })
})
