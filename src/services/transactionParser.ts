import { type Address } from 'viem'

export interface TransferEvent {
  from: Address
  to: Address
  value: string
  token?: {
    symbol: string
    name: string
    address: Address
  }
}

export interface ParsedTransaction {
  victim: Address | null
  scammer: Address | null
  transfers: TransferEvent[]
  chainId: number
  txHash: string
}

/**
 * Fetch transaction from backend API and parse transfers to identify victim/scammer
 */
export async function parseTheftTransaction(
  txHash: string,
  chainId: number
): Promise<ParsedTransaction> {
  // Call backend API (keeps Etherscan key secure)
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  
  const response = await fetch(`${apiUrl}/parse-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ txHash, chainId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to parse transaction' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  const data = await response.json()
  return data as ParsedTransaction
}
