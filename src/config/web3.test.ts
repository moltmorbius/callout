import { describe, it, expect } from 'vitest'
import { explorerUrls, getExplorerTxUrl } from './web3'

describe('explorerUrls', () => {
  it('uses IPFS-hosted PulseChain explorer for chain 369', () => {
    expect(explorerUrls[369]).toBe('https://ipfs.scan.pulsechain.com')
  })

  it('has Etherscan for chain 1', () => {
    expect(explorerUrls[1]).toBe('https://etherscan.io')
  })

  it('has entries for all major supported chains', () => {
    const expectedChainIds = [1, 369, 137, 42161, 10, 8453, 56]
    for (const id of expectedChainIds) {
      expect(explorerUrls[id]).toBeDefined()
    }
  })
})

describe('getExplorerTxUrl', () => {
  it('builds correct URL for Ethereum', () => {
    const url = getExplorerTxUrl(1, '0xabc123')
    expect(url).toBe('https://etherscan.io/tx/0xabc123')
  })

  it('builds correct URL for PulseChain using ipfs explorer', () => {
    const url = getExplorerTxUrl(369, '0xdef456')
    expect(url).toBe('https://ipfs.scan.pulsechain.com/tx/0xdef456')
  })

  it('falls back to Etherscan for unknown chain IDs', () => {
    const url = getExplorerTxUrl(99999, '0xfff')
    expect(url).toBe('https://etherscan.io/tx/0xfff')
  })

  it('builds correct URL for Polygon', () => {
    const url = getExplorerTxUrl(137, '0x789')
    expect(url).toBe('https://polygonscan.com/tx/0x789')
  })

  it('builds correct URL for Arbitrum', () => {
    const url = getExplorerTxUrl(42161, '0x111')
    expect(url).toBe('https://arbiscan.io/tx/0x111')
  })

  it('builds correct URL for Base', () => {
    const url = getExplorerTxUrl(8453, '0x222')
    expect(url).toBe('https://basescan.org/tx/0x222')
  })

  it('builds correct URL for BSC', () => {
    const url = getExplorerTxUrl(56, '0x333')
    expect(url).toBe('https://bscscan.com/tx/0x333')
  })

  it('builds correct URL for Optimism', () => {
    const url = getExplorerTxUrl(10, '0x444')
    expect(url).toBe('https://optimistic.etherscan.io/tx/0x444')
  })
})
