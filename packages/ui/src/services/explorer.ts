/**
 * BlockScout V2 API client for PulseChain.
 *
 * Fetches real on-chain transaction data from the PulseChain block explorer.
 * No API key required.
 */

import type { Callout } from '@callout/shared/types'
import { isLikelyText } from '@callout/shared/encoding'
import { type Hex } from 'viem'

/* ── Constants ───────────────────────────────────────────── */

const BLOCKSCOUT_BASE = 'https://api.scan.pulsechain.com/api/v2'
const PULSECHAIN_ID = 369

/* ── BlockScout V2 API types ─────────────────────────────── */

interface BlockScoutAddress {
  readonly hash: string
  readonly name: string | null
  readonly is_contract: boolean
}

export interface BlockScoutTransaction {
  readonly hash: string
  readonly from: BlockScoutAddress
  readonly to: BlockScoutAddress | null
  readonly value: string
  readonly raw_input: string
  readonly timestamp: string
  readonly block: number
  readonly status: string
  readonly method: string | null
  readonly gas_used: string
  readonly gas_price: string
  readonly fee: { readonly value: string }
}

export interface BlockScoutNextPage {
  readonly block_number: number
  readonly fee: string
  readonly hash: string
  readonly index: number
  readonly inserted_at: string
  readonly items_count: number
  readonly value: string
}

export interface BlockScoutTxListResponse {
  readonly items: readonly BlockScoutTransaction[]
  readonly next_page_params: BlockScoutNextPage | null
}

/* ── Fetch helpers ───────────────────────────────────────── */

/**
 * Fetch transactions sent FROM a given address on PulseChain.
 * Returns the raw BlockScout response with pagination support.
 *
 * Throws descriptive errors for better error handling.
 */
export async function fetchAddressTransactions(
  address: string,
  nextPageParams?: BlockScoutNextPage | null,
): Promise<BlockScoutTxListResponse> {
  const url = new URL(`${BLOCKSCOUT_BASE}/addresses/${address}/transactions`)
  url.searchParams.set('type', 'from')

  if (nextPageParams) {
    url.searchParams.set('block_number', String(nextPageParams.block_number))
    url.searchParams.set('fee', nextPageParams.fee)
    url.searchParams.set('hash', nextPageParams.hash)
    url.searchParams.set('index', String(nextPageParams.index))
    url.searchParams.set('inserted_at', nextPageParams.inserted_at)
    url.searchParams.set('items_count', String(nextPageParams.items_count))
    url.searchParams.set('value', nextPageParams.value)
  }

  const res = await fetch(url.toString())

  // BlockScout returns 404 for addresses with no transactions
  if (res.status === 404) {
    return { items: [], next_page_params: null }
  }

  if (!res.ok) {
    if (res.status >= 500) {
      throw new Error(`BlockScout API is temporarily unavailable (${res.status}). Try again in a moment.`)
    }
    if (res.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
    }
    throw new Error(`BlockScout API error (${res.status}): ${res.statusText}`)
  }

  try {
    return await res.json() as BlockScoutTxListResponse
  } catch (err) {
    throw new Error('Failed to parse BlockScout API response. The service may be experiencing issues.')
  }
}

/* ── Decode + filter ─────────────────────────────────────── */

/**
 * Try to decode raw calldata as a UTF-8 text message.
 * Returns the decoded string if it looks like human-readable text,
 * or null if it's contract call data / binary.
 */
function tryDecodeCalldata(rawInput: string): string | null {
  if (!rawInput || rawInput === '0x' || rawInput.length < 4) return null

  try {
    const hex = rawInput.startsWith('0x') ? rawInput : `0x${rawInput}`

    // Skip obvious 4-byte function selectors (contract calls)
    // Text messages won't start with a valid selector pattern
    // Heuristic: if the first 4 bytes decode to non-printable, it's likely a function call
    if (hex.length >= 10) {
      const firstByte = parseInt(hex.slice(2, 4), 16)
      // Function selectors almost never start with printable ASCII range (0x20-0x7E)
      // Text messages almost always do
      if (firstByte < 0x20 || firstByte > 0x7e) return null
    }

    if (!isLikelyText(hex as Hex)) return null

    const bytes = new Uint8Array(
      (hex.slice(2).match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)),
    )
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

/**
 * Check if a decoded message is an encrypted callout
 * (starts with the ENC: prefix used by the encryption module).
 */
function isEncryptedCallout(message: string): boolean {
  return message.startsWith('ENC:')
}

/**
 * Convert BlockScout transactions to Callout objects.
 * Filters out transactions that don't contain decodable text messages.
 */
export function transactionsToCallouts(
  txs: readonly BlockScoutTransaction[],
): Callout[] {
  const callouts: Callout[] = []

  for (const tx of txs) {
    if (!tx.to) continue

    const decoded = tryDecodeCalldata(tx.raw_input)
    if (!decoded) continue

    callouts.push({
      id: tx.hash,
      sender: tx.from.hash,
      target: tx.to.hash,
      message: decoded,
      timestamp: Math.floor(new Date(tx.timestamp).getTime() / 1000),
      chainId: PULSECHAIN_ID,
      txHash: tx.hash,
      encrypted: isEncryptedCallout(decoded),
    })
  }

  return callouts
}
