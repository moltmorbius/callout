/**
 * Direct blockchain RPC calls via viem public clients.
 *
 * Used for fetching individual transactions by hash — goes straight
 * to the chain RPC, no explorer API needed.
 */

import { createPublicClient, http, type Chain, type Hex } from 'viem'
import { mainnet, polygon, arbitrum, optimism, base, bsc } from 'viem/chains'

/* ── PulseChain definition ───────────────────────────────── */

const pulsechain: Chain = {
  id: 369,
  name: 'PulseChain',
  nativeCurrency: { name: 'PLS', symbol: 'PLS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.pulsechain.com'] },
  },
  blockExplorers: {
    default: { name: 'PulseScan', url: 'https://scan.pulsechain.com' },
  },
}

/* ── Chain registry ──────────────────────────────────────── */

export const chains: Record<number, Chain> = {
  1: mainnet,
  369: pulsechain,
  137: polygon,
  42161: arbitrum,
  10: optimism,
  8453: base,
  56: bsc,
}

/** All supported chain IDs */
export const SUPPORTED_CHAIN_IDS = Object.keys(chains).map(Number)

/** Default chain for tx lookup when none specified - prioritize Ethereum mainnet */
export const DEFAULT_CHAIN_ID = 1

/* ── Client cache ────────────────────────────────────────── */

const clientCache = new Map<number, ReturnType<typeof createPublicClient>>()

function getClient(chainId: number) {
  let client = clientCache.get(chainId)
  if (!client) {
    const chain = chains[chainId]
    if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`)
    client = createPublicClient({ chain, transport: http() })
    clientCache.set(chainId, client)
  }
  return client
}

/* ── Transaction lookup ──────────────────────────────────── */

export interface TransactionResult {
  readonly hash: string
  readonly from: string
  readonly to: string | null
  readonly value: bigint
  readonly input: string
  readonly chainId: number
  readonly blockNumber: bigint | null
}

/**
 * Fetch a transaction by hash from the blockchain RPC.
 *
 * Tries the specified chain first. If not found and no chain was
 * specified, falls back to trying all supported chains.
 *
 * Throws descriptive errors for better error handling.
 */
export async function fetchTransaction(
  hash: Hex,
  chainId?: number,
): Promise<TransactionResult> {
  // When no chainId specified, try Ethereum mainnet first (most common), then other chains
  const chainsToTry = chainId
    ? [chainId]
    : [1, ...SUPPORTED_CHAIN_IDS.filter((id) => id !== 1)]

  let lastError: Error | null = null

  for (const cid of chainsToTry) {
    try {
      const client = getClient(cid)
      const tx = await client.getTransaction({ hash })
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        input: tx.input,
        chainId: cid,
        blockNumber: tx.blockNumber,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // If we're only checking one chain, provide more specific error
      if (chainId) {
        const chainName = chains[chainId]?.name || `Chain ${chainId}`
        throw new Error(`Transaction not found on ${chainName}. Verify the hash and network.`)
      }

      // Transaction not found on this chain — try next
      continue
    }
  }

  // Exhausted all chains
  throw new Error(
    `Transaction not found on any supported chain. ${lastError?.message ? `Last error: ${lastError.message}` : ''
    }`
  )
}

/**
 * Check if a string looks like a transaction hash.
 * 66 chars: 0x + 64 hex chars.
 */
export function isTxHash(input: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(input.trim())
}
