import { type Address } from 'viem'

export interface TransferEvent {
  from: Address
  to: Address
  value: string
  type?: 'native' | 'erc20' | 'erc721' | 'erc1155' | 'erc1155-batch'
  tokenId?: string
  token?: {
    symbol: string
    name: string
    address: Address | null
    decimals?: number
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
/**
 * Fetch transaction from backend API and parse transfers to identify victim/scammer
 * 
 * @param txHash - Transaction hash to parse
 * @param chainId - Chain ID for the transaction
 * @returns Parsed transaction data with victim, scammer, and transfers
 * @throws Error with detailed message if parsing fails
 */
export async function parseTheftTransaction(
  txHash: string,
  chainId: number
): Promise<ParsedTransaction> {
  // Call backend API (keeps Etherscan key secure)
  // In development: handled by Vite plugin (same server)
  // In production: can use VITE_API_URL if backend is separate, otherwise relative path
  const baseUrl = import.meta.env.VITE_API_URL
  const endpoint = baseUrl ? `${baseUrl}/api/parse-transaction` : '/api/parse-transaction'
  
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txHash, chainId }),
    })
  } catch (err) {
    const error = err as Error
    throw new Error(`Network error: ${error.message || 'Failed to connect to API'}`)
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    let errorDetails: { error?: string; message?: string } = {}
    
    try {
      errorDetails = await response.json()
    } catch {
      // If response body isn't JSON, try to get text
      try {
        const text = await response.text()
        if (text) {
          errorMessage = text
        }
      } catch {
        // Ignore text parsing errors
      }
    }
    
    // Use error message from API if available
    const apiError = errorDetails.error || errorDetails.message
    if (apiError) {
      errorMessage = apiError
    } else if (response.status === 404) {
      errorMessage = 'Transaction not found. Check the transaction hash and chain ID.'
    } else if (response.status === 400) {
      errorMessage = 'Invalid transaction hash or chain ID.'
    } else if (response.status >= 500) {
      errorMessage = 'Server error. Please try again later.'
    }
    
    throw new Error(errorMessage)
  }

  let data: ParsedTransaction
  try {
    data = await response.json()
  } catch (err) {
    const error = err as Error
    throw new Error(`Failed to parse response: ${error.message || 'Invalid JSON response'}`)
  }

  // Validate response structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format from API')
  }

  return data as ParsedTransaction
}
