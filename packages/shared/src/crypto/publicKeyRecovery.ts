/**
 * Public key recovery from Ethereum transactions.
 *
 * Recovers uncompressed secp256k1 public keys from transaction signatures.
 * Network-dependent functions accept RPC URLs and API keys as explicit parameters.
 */

import {
  type Hex,
  type Address,
  createPublicClient,
  http,
  recoverPublicKey,
  keccak256,
  serializeTransaction,
  getAddress,
} from 'viem'

// ── Network configuration ────────────────────────────────────────────

interface NetworkConfig {
  readonly chainId: number
  readonly api: string
  readonly rpc: string
  readonly name: string
}

/** Supported networks with Etherscan-compatible APIs and public RPCs. */
const NETWORKS: readonly NetworkConfig[] = [
  { chainId: 1, api: 'https://api.etherscan.io/api', rpc: 'https://eth.llamarpc.com', name: 'Ethereum' },
  { chainId: 137, api: 'https://api.polygonscan.com/api', rpc: 'https://polygon-rpc.com', name: 'Polygon' },
  { chainId: 42161, api: 'https://api.arbiscan.io/api', rpc: 'https://arb1.arbitrum.io/rpc', name: 'Arbitrum' },
  { chainId: 10, api: 'https://api-optimistic.etherscan.io/api', rpc: 'https://mainnet.optimism.io', name: 'Optimism' },
  { chainId: 8453, api: 'https://api.basescan.org/api', rpc: 'https://mainnet.base.org', name: 'Base' },
  { chainId: 56, api: 'https://api.bscscan.com/api', rpc: 'https://bsc-dataseed.binance.org', name: 'BSC' },
] as const

// ── Public key → address derivation ──────────────────────────────────

/**
 * Derive an Ethereum address from an uncompressed secp256k1 public key.
 * The public key is expected in the 0x04... uncompressed format (65 bytes / 130 hex chars + 0x prefix).
 * Address = last 20 bytes of keccak256(publicKey x,y coordinates).
 *
 * keccak256 returns 0x + 64 hex chars (32 bytes).
 * We take the last 20 bytes: skip "0x" (2 chars) + first 12 bytes (24 chars) = slice from index 26.
 * Result: 40 hex chars = 20 bytes = valid Ethereum address.
 */
export function publicKeyToAddress(publicKey: Hex): Address {
  // Strip the 04 prefix to get the raw 64-byte x,y coordinates
  const xyCoordinates = `0x${publicKey.slice(4)}` as Hex
  const hash = keccak256(xyCoordinates)
  // Last 20 bytes of the hash: "0x" prefix (2) + 12 bytes to skip (24) = 26
  return getAddress(`0x${hash.slice(26)}`)
}

// ── Transaction-based public key recovery ────────────────────────────

/** Fields needed to serialize a transaction for signing hash reconstruction. */
interface TxForSigning {
  to: Address | null
  value: bigint
  data: Hex
  nonce: number
  gas: bigint
  chainId: number | undefined
  type: string
  gasPrice?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
}

/**
 * Fetch a transaction by hash from the given RPC and recover the sender's
 * uncompressed secp256k1 public key.
 *
 * @param rpcUrl - RPC endpoint URL
 * @param txHash - Transaction hash
 */
export async function fetchAndRecoverPublicKey({
  rpcUrl,
  txHash,
}: {
  rpcUrl: string
  txHash: Hex
}): Promise<Hex> {
  const client = createPublicClient({ transport: http(rpcUrl) })

  const tx = await client.getTransaction({ hash: txHash })
  if (!tx) {
    throw new Error('Transaction not found')
  }

  const signature = `${tx.r}${tx.s.slice(2)}${(tx.v ?? 0n).toString(16).padStart(2, '0')}` as Hex

  const txForSigning: TxForSigning = {
    to: tx.to,
    value: tx.value,
    data: tx.input,
    nonce: tx.nonce,
    gas: tx.gas,
    chainId: tx.chainId,
    type: tx.type,
  }

  if (tx.type === 'legacy') {
    txForSigning.gasPrice = tx.gasPrice
  } else if (tx.type === 'eip1559') {
    txForSigning.maxFeePerGas = tx.maxFeePerGas
    txForSigning.maxPriorityFeePerGas = tx.maxPriorityFeePerGas
  } else {
    if (tx.gasPrice) txForSigning.gasPrice = tx.gasPrice
    if (tx.maxFeePerGas) txForSigning.maxFeePerGas = tx.maxFeePerGas
    if (tx.maxPriorityFeePerGas) txForSigning.maxPriorityFeePerGas = tx.maxPriorityFeePerGas
  }

  const serialized = serializeTransaction(txForSigning as Parameters<typeof serializeTransaction>[0])
  const hash = keccak256(serialized)

  return recoverPublicKey({ hash, signature })
}

// ── Cross-chain transaction search ───────────────────────────────────

/**
 * Search for a transaction by hash across multiple networks via Etherscan APIs.
 *
 * @param txHash - Transaction hash to search for
 * @param apiKey - Etherscan API key (required)
 * @returns The matching network config or null if not found
 */
export async function searchTransactionAcrossChains(
  txHash: string,
  apiKey: string,
): Promise<{ chainId: number; rpcUrl: string } | null> {
  if (!apiKey) {
    console.warn('Etherscan API key not provided, skipping cross-chain search')
    return null
  }

  for (const network of NETWORKS) {
    try {
      const url = new URL(network.api)
      url.searchParams.set('module', 'proxy')
      url.searchParams.set('action', 'eth_getTransactionByHash')
      url.searchParams.set('txhash', txHash)
      url.searchParams.set('apikey', apiKey)

      const response = await fetch(url.toString())
      const data = await response.json() as Record<string, unknown>
      const result = data['result'] as Record<string, string> | null

      if (result && result['hash']) {
        return { chainId: network.chainId, rpcUrl: network.rpc }
      }
    } catch {
      continue
    }
  }

  return null
}

// ── Address-based public key recovery ────────────────────────────────

/** Result of a successful public key recovery from an address. */
export interface RecoveredPublicKey {
  publicKey: Hex
  derivedAddress: Address
  txHash: string
  chainId: number
  chainName: string
}

/**
 * Recover the public key for a given address by:
 * 1. Fetching recent transactions sent FROM the address (via Etherscan txlist)
 * 2. Taking the first transaction with a recoverable signature
 * 3. Recovering the uncompressed secp256k1 public key
 * 4. Verifying the derived address matches the expected address
 *
 * @param address - Ethereum address to recover public key for
 * @param apiKey - Etherscan API key (required)
 * @param preferredChainId - Optional chain to try first
 */
export async function recoverPublicKeyFromAddress({
  address,
  apiKey,
  preferredChainId,
}: {
  address: Address
  apiKey: string
  preferredChainId?: number
}): Promise<RecoveredPublicKey> {
  if (!apiKey) {
    throw new Error('Etherscan API key is required for public key recovery')
  }

  const normalizedAddress = address.toLowerCase()

  const orderedNetworks = preferredChainId
    ? [
      ...NETWORKS.filter(n => n.chainId === preferredChainId),
      ...NETWORKS.filter(n => n.chainId !== preferredChainId),
    ]
    : [...NETWORKS]

  for (const network of orderedNetworks) {
    try {
      const url = new URL(network.api)
      url.searchParams.set('module', 'account')
      url.searchParams.set('action', 'txlist')
      url.searchParams.set('address', address)
      url.searchParams.set('startblock', '0')
      url.searchParams.set('endblock', '99999999')
      url.searchParams.set('page', '1')
      url.searchParams.set('offset', '5')
      url.searchParams.set('sort', 'desc')
      url.searchParams.set('apikey', apiKey)

      const response = await fetch(url.toString())
      const data = await response.json() as Record<string, unknown>

      if (data['status'] !== '1' || !Array.isArray(data['result']) || (data['result'] as unknown[]).length === 0) {
        continue
      }

      const outgoingTxs = (data['result'] as Record<string, string>[]).filter(
        (tx) => tx['from']?.toLowerCase() === normalizedAddress
      )

      if (outgoingTxs.length === 0) {
        continue
      }

      const firstTx = outgoingTxs[0]!
      const txHash = firstTx['hash'] as Hex

      const publicKey = await fetchAndRecoverPublicKey({
        rpcUrl: network.rpc,
        txHash,
      })

      const derivedAddress = publicKeyToAddress(publicKey)

      if (derivedAddress.toLowerCase() !== normalizedAddress) {
        throw new Error(
          `Address mismatch: recovered ${derivedAddress} but expected ${address}. ` +
          `The recovered public key does not belong to this address.`
        )
      }

      return {
        publicKey,
        derivedAddress,
        txHash,
        chainId: network.chainId,
        chainName: network.name,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Address mismatch')) {
        throw error
      }
      continue
    }
  }

  throw new Error(
    `No outgoing transactions found for ${address} on any supported network. ` +
    `The address must have sent at least one transaction to derive its public key.`
  )
}
