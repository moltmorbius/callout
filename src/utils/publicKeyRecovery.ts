import { type Hex, createPublicClient, http, recoverPublicKey, keccak256, serializeTransaction } from 'viem'

/**
 * Fetch transaction and recover the sender's public key.
 * This properly reconstructs the signing hash based on transaction type.
 */
export async function fetchAndRecoverPublicKey(
  rpcUrl: string,
  txHash: Hex,
): Promise<Hex> {
  const client = createPublicClient({
    transport: http(rpcUrl),
  })

  const tx = await client.getTransaction({ hash: txHash })
  if (!tx) {
    throw new Error('Transaction not found')
  }

  // For this to work, we need to reconstruct the message that was signed
  // This is complex and depends on transaction type (legacy, EIP-1559, etc.)
  // For now, we'll use a simpler approach: extract public key from signature
  
  // Build the signature
  const signature = `${tx.r}${tx.s.slice(2)}${(tx.v ?? 0n).toString(16).padStart(2, '0')}` as Hex
  
  // Reconstruct the signing hash
  // For legacy transactions: keccak256(RLP(nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0))
  // For EIP-1559: keccak256(0x02 || RLP(chainId, nonce, maxPriorityFee, maxFee, gas, to, value, data, accessList))
  
  try {
    // Build transaction object for serialization
    const txForSigning: any = {
      to: tx.to,
      value: tx.value,
      data: tx.input,
      nonce: tx.nonce,
      gas: tx.gas,
      chainId: tx.chainId,
    }

    // Add type-specific fields
    if (tx.type === 'legacy') {
      txForSigning.type = 'legacy'
      txForSigning.gasPrice = tx.gasPrice
    } else if (tx.type === 'eip1559') {
      txForSigning.type = 'eip1559'
      txForSigning.maxFeePerGas = tx.maxFeePerGas
      txForSigning.maxPriorityFeePerGas = tx.maxPriorityFeePerGas
    } else {
      // Fallback for other types
      txForSigning.type = tx.type
      if (tx.gasPrice) txForSigning.gasPrice = tx.gasPrice
      if (tx.maxFeePerGas) txForSigning.maxFeePerGas = tx.maxFeePerGas
      if (tx.maxPriorityFeePerGas) txForSigning.maxPriorityFeePerGas = tx.maxPriorityFeePerGas
    }
    
    const serialized = serializeTransaction(txForSigning)
    const hash = keccak256(serialized)
    
    return recoverPublicKey({
      hash,
      signature,
    })
  } catch (error) {
    throw new Error(`Failed to recover public key: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Search for a transaction across multiple networks using Etherscan API.
 * Returns { chainId, rpcUrl } if found.
 */
export async function searchTransactionAcrossChains(
  txHash: string,
): Promise<{ chainId: number; rpcUrl: string } | null> {
  const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY
  if (!apiKey) {
    console.warn('VITE_ETHERSCAN_API_KEY not set, skipping cross-chain search')
    return null
  }

  // Network configs with Etherscan API endpoints
  const networks = [
    { chainId: 1, api: 'https://api.etherscan.io/api', rpc: 'https://eth.llamarpc.com' },
    { chainId: 137, api: 'https://api.polygonscan.com/api', rpc: 'https://polygon-rpc.com' },
    { chainId: 42161, api: 'https://api.arbiscan.io/api', rpc: 'https://arb1.arbitrum.io/rpc' },
    { chainId: 10, api: 'https://api-optimistic.etherscan.io/api', rpc: 'https://mainnet.optimism.io' },
    { chainId: 8453, api: 'https://api.basescan.org/api', rpc: 'https://mainnet.base.org' },
    { chainId: 56, api: 'https://api.bscscan.com/api', rpc: 'https://bsc-dataseed.binance.org' },
  ]

  for (const network of networks) {
    try {
      const url = new URL(network.api)
      url.searchParams.set('module', 'proxy')
      url.searchParams.set('action', 'eth_getTransactionByHash')
      url.searchParams.set('txhash', txHash)
      url.searchParams.set('apikey', apiKey)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.result && data.result.hash) {
        return { chainId: network.chainId, rpcUrl: network.rpc }
      }
    } catch {
      continue
    }
  }

  return null
}
