import { describe, it, expect } from 'vitest'
import { CHAIN_INFO, getCalloutTxUrl, getCalloutAddressUrl } from './callout'

describe('CHAIN_INFO', () => {
  it('contains all expected chains', () => {
    expect(CHAIN_INFO[1]).toBeDefined()       // Ethereum
    expect(CHAIN_INFO[369]).toBeDefined()     // PulseChain
    expect(CHAIN_INFO[137]).toBeDefined()     // Polygon
    expect(CHAIN_INFO[42161]).toBeDefined()   // Arbitrum
    expect(CHAIN_INFO[10]).toBeDefined()      // Optimism
    expect(CHAIN_INFO[8453]).toBeDefined()    // Base
    expect(CHAIN_INFO[56]).toBeDefined()      // BSC
  })

  it('each chain has required fields', () => {
    for (const [, info] of Object.entries(CHAIN_INFO)) {
      expect(info.name).toBeTruthy()
      expect(info.explorerUrl).toMatch(/^https:\/\//)
      expect(info.color).toMatch(/^#/)
      expect(info.emoji).toBeTruthy()
    }
  })
})

describe('getCalloutTxUrl', () => {
  it('returns correct Ethereum TX URL', () => {
    const url = getCalloutTxUrl(1, '0xabc123')
    expect(url).toBe('https://etherscan.io/tx/0xabc123')
  })

  it('returns correct PulseChain TX URL', () => {
    const url = getCalloutTxUrl(369, '0xdef456')
    expect(url).toBe('https://ipfs.scan.pulsechain.com/tx/0xdef456')
  })

  it('falls back to etherscan for unknown chain', () => {
    const url = getCalloutTxUrl(99999, '0x123')
    expect(url).toBe('https://etherscan.io/tx/0x123')
  })
})

describe('getCalloutAddressUrl', () => {
  it('returns correct Ethereum address URL', () => {
    const url = getCalloutAddressUrl(1, '0xabc123')
    expect(url).toBe('https://etherscan.io/address/0xabc123')
  })

  it('returns correct Base address URL', () => {
    const url = getCalloutAddressUrl(8453, '0xdef456')
    expect(url).toBe('https://basescan.org/address/0xdef456')
  })

  it('falls back to etherscan for unknown chain', () => {
    const url = getCalloutAddressUrl(99999, '0x123')
    expect(url).toBe('https://etherscan.io/address/0x123')
  })
})
