/**
 * Core types for the Callout system.
 * Shared across UI, CLI, and API packages.
 */

/** Represents a single on-chain callout message. */
export interface Callout {
  /** Unique identifier (tx hash) */
  readonly id: string
  /** Sender wallet address */
  readonly sender: string
  /** Target (scammer) wallet address */
  readonly target: string
  /** Decoded message content */
  readonly message: string
  /** Unix timestamp (seconds) */
  readonly timestamp: number
  /** Chain ID where the callout was posted */
  readonly chainId: number
  /** Transaction hash */
  readonly txHash: string
  /** Whether the message is encrypted */
  readonly encrypted: boolean
}

/** Chain metadata for display */
export interface ChainInfo {
  readonly name: string
  readonly explorerUrl: string
  readonly color: string
  readonly emoji: string
}

/** Supported chain info lookup */
export const CHAIN_INFO: Record<number, ChainInfo> = {
  1: { name: 'Ethereum', explorerUrl: 'https://etherscan.io', color: '#627eea', emoji: 'Ξ' },
  369: { name: 'PulseChain', explorerUrl: 'https://ipfs.scan.pulsechain.com', color: '#00ff88', emoji: '💜' },
  137: { name: 'Polygon', explorerUrl: 'https://polygonscan.com', color: '#8247e5', emoji: '🟣' },
  42161: { name: 'Arbitrum', explorerUrl: 'https://arbiscan.io', color: '#28a0f0', emoji: '🔵' },
  10: { name: 'Optimism', explorerUrl: 'https://optimistic.etherscan.io', color: '#ff0420', emoji: '🔴' },
  8453: { name: 'Base', explorerUrl: 'https://basescan.org', color: '#0052ff', emoji: '🔷' },
  56: { name: 'BSC', explorerUrl: 'https://bscscan.com', color: '#f3ba2f', emoji: '🟡' },
}

/** Get the block explorer TX URL for a given chain and tx hash */
export function getCalloutTxUrl(chainId: number, txHash: string): string {
  const chain = CHAIN_INFO[chainId]
  const base = chain?.explorerUrl ?? 'https://etherscan.io'
  return `${base}/tx/${txHash}`
}

/** Get the block explorer address URL for a given chain and address */
export function getCalloutAddressUrl(chainId: number, address: string): string {
  const chain = CHAIN_INFO[chainId]
  const base = chain?.explorerUrl ?? 'https://etherscan.io'
  return `${base}/address/${address}`
}
