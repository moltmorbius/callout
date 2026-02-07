import { defineConfig } from 'vite'
import type { ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables - try api/.env first, then root .env
const rootDir = dirname(fileURLToPath(import.meta.url))
const apiEnvPath = join(rootDir, 'api', '.env')
const rootEnvPath = join(rootDir, '.env')

// Try api/.env first (preferred location)
let envResult = dotenv.config({ path: apiEnvPath })
if (envResult.error) {
  // Fall back to root .env
  envResult = dotenv.config({ path: rootEnvPath })
  if (!envResult.error) {
    console.log(`[Vite API Plugin] Loaded .env from root: ${rootEnvPath}`)
  }
} else {
  console.log(`[Vite API Plugin] Loaded .env from api: ${apiEnvPath}`)
}

// Also load from process.env (for Railway/production)
if (process.env.ETHERSCAN_API_KEY) {
  console.log(`[Vite API Plugin] ETHERSCAN_API_KEY found in process.env`)
}

// Etherscan unified API endpoint - supports multiple chains via chainid parameter
const ETHERSCAN_UNIFIED_API = 'https://api.etherscan.io/v2'

function viteApiPlugin() {
  return {
    name: 'vite-api-plugin',
    configureServer(server: ViteDevServer) {
      console.log('[Vite API Plugin] Initializing Express middleware for API routes...')

      const app = express()
      app.use(cors())
      app.use(express.json())

      // Request logging middleware - only log API calls
      app.use((req: Request, _res: Response, next: NextFunction) => {
        // Only log API routes, skip all static files and other requests
        if (req.path.startsWith('/api')) {
          const timestamp = new Date().toISOString()
          console.log(`[${timestamp}] ${req.method} ${req.path}`, {
            body: Object.keys(req.body || {}).length > 0 ? req.body : undefined,
            query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
          })
        }
        next()
      })

      // Health check
      app.get('/api/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok' })
      })

      // Parse transaction endpoint
      app.post('/api/parse-transaction', async (req: Request, res: Response) => {
        console.log(`[API] /api/parse-transaction - Received request:`, {
          txHash: req.body.txHash,
          chainId: req.body.chainId
        })
        try {
          const { txHash, chainId } = req.body

          if (!txHash || !chainId) {
            console.warn('[API] /api/parse-transaction - Bad request: missing txHash or chainId', { txHash, chainId })
            return res.status(400).json({ error: 'txHash and chainId are required' })
          }

          // Check for ETHERSCAN_API_KEY or VITE_ETHERSCAN_API_KEY (Vite prefixes env vars)
          const apiKey = process.env.ETHERSCAN_API_KEY || process.env.VITE_ETHERSCAN_API_KEY
          if (!apiKey) {
            console.error('[API] /api/parse-transaction - ERROR: ETHERSCAN_API_KEY not configured')
            console.error('[API] Available env vars:', Object.keys(process.env).filter(k => k.includes('ETHERSCAN')))
            console.error('[API] Current working directory:', process.cwd())
            return res.status(500).json({ error: 'Etherscan API key not configured. Please set ETHERSCAN_API_KEY in api/.env or root .env' })
          }

          console.log(`[API] /api/parse-transaction - Using API key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`)

          // Fetch transaction and receipt using unified API with chainid parameter
          const receiptUrl = `${ETHERSCAN_UNIFIED_API}/api?chainid=${chainId}&module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`
          const txUrl = `${ETHERSCAN_UNIFIED_API}/api?chainid=${chainId}&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`

          console.log(`[API] /api/parse-transaction - Fetching from Etherscan:`, { chainId, txHash: txHash.slice(0, 10) + '...' })

          const [receiptRes, txRes] = await Promise.all([
            fetch(receiptUrl),
            fetch(txUrl)
          ])

          const receiptData = await receiptRes.json() as any
          const txData = await txRes.json() as any

          if (receiptData.error || !receiptData.result) {
            const errorMsg = receiptData.error?.message || 'Unknown error'
            let detailedError = `Transaction not found on chain ${chainId}`
            if (errorMsg.includes('rate limit') || errorMsg.includes('Max rate limit')) {
              detailedError = `Etherscan API rate limit exceeded. Please try again in a moment.`
            } else if (errorMsg.includes('Invalid API Key')) {
              detailedError = `Etherscan API key is invalid or expired.`
            } else {
              detailedError = `Transaction not found on chain ${chainId}. ${errorMsg}. Verify the transaction hash and ensure it exists on this network.`
            }
            return res.status(404).json({ error: detailedError })
          }

          const receipt = receiptData.result
          const transaction = txData.result
          const logs = receipt.logs || []

          // Parse all transfer types
          const transfers: any[] = []

          // Transfer event signatures
          const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // ERC20 & ERC721 Transfer
          const ERC1155_TRANSFER_SINGLE_TOPIC = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62'
          const ERC1155_TRANSFER_BATCH_TOPIC = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'

          // 1. Parse native ETH transfer (transaction value)
          if (transaction && transaction.value && BigInt(transaction.value) > 0n) {
            const nativeValue = BigInt(transaction.value).toString()
            transfers.push({
              from: transaction.from,
              to: transaction.to || receipt.to,
              value: nativeValue,
              token: {
                symbol: 'ETH',
                name: 'Ethereum',
                address: null, // Native token has no contract address
              },
              type: 'native'
            })
          }

          // 2. Parse ERC20 and ERC721 Transfer events (same topic signature)
          for (const log of logs) {
            if (log.topics[0] === ERC20_TRANSFER_TOPIC && log.topics.length >= 3) {
              const from = ('0x' + log.topics[1].slice(26)) as string
              const to = ('0x' + log.topics[2].slice(26)) as string

              // ERC20: data contains value (uint256)
              // ERC721: data contains tokenId (uint256), topics[3] may also contain tokenId
              const dataValue = log.data && log.data !== '0x' ? BigInt(log.data).toString() : null
              const tokenId = log.topics.length >= 4 ? BigInt(log.topics[3]).toString() : null

              // Try to fetch token info first to help differentiate
              let token: { symbol: string; name: string; address: string; decimals?: number } | null = null
              let tokenDecimals: number | null = null
              try {
                const tokenInfoUrl = `${ETHERSCAN_UNIFIED_API}/api?chainid=${chainId}&module=token&action=tokeninfo&contractaddress=${log.address}&apikey=${apiKey}`
                const tokenRes = await fetch(tokenInfoUrl)
                const tokenData = await tokenRes.json() as any
                if (tokenData.result) {
                  tokenDecimals = tokenData.result.decimals ? parseInt(tokenData.result.decimals) : null
                  token = {
                    symbol: tokenData.result.symbol || 'UNKNOWN',
                    name: tokenData.result.name || 'Unknown Token',
                    address: log.address,
                    decimals: tokenDecimals ?? undefined,
                  }
                }
              } catch {
                // Ignore token info errors
              }

              // Differentiate ERC20 vs ERC721:
              // 1. Primary: If topics[3] exists (indexed tokenId), it's ERC721
              // 2. Secondary: If token info has decimals > 0, it's ERC20
              // 3. Secondary: If token info has decimals === 0, it's ERC721 (ERC20 rarely uses 0 decimals)
              // 4. Fallback: If no token info and topics.length === 3, assume ERC20 (most common)
              const hasIndexedTokenId = tokenId !== null
              let isERC721: boolean

              if (hasIndexedTokenId) {
                // topics[3] exists = indexed tokenId = ERC721
                isERC721 = true
              } else if (tokenDecimals !== null) {
                // Token info available: use decimals to differentiate
                isERC721 = tokenDecimals === 0 // ERC721 has no decimals, ERC20 typically has 18
              } else {
                // No token info: assume ERC20 (more common than ERC721)
                isERC721 = false
              }

              if (isERC721) {
                // ERC721 transfer
                transfers.push({
                  from,
                  to,
                  value: tokenId || dataValue || '1',
                  token: token || {
                    symbol: 'NFT',
                    name: 'Non-Fungible Token',
                    address: log.address,
                    decimals: 0,
                  },
                  tokenId: tokenId || dataValue,
                  type: 'erc721'
                })
              } else {
                // ERC20 transfer
                transfers.push({
                  from,
                  to,
                  value: dataValue || '0',
                  token: token || {
                    symbol: 'UNKNOWN',
                    name: 'Unknown Token',
                    address: log.address,
                    decimals: 18,
                  },
                  type: 'erc20'
                })
              }
            }
          }

          // 3. Parse ERC1155 TransferSingle events
          for (const log of logs) {
            if (log.topics[0] === ERC1155_TRANSFER_SINGLE_TOPIC && log.topics.length >= 4) {
              const from = ('0x' + log.topics[2].slice(26)) as string
              const to = ('0x' + log.topics[3].slice(26)) as string

              // Parse data: tokenId (uint256), value (uint256)
              if (log.data && log.data.length >= 130) {
                const tokenId = BigInt('0x' + log.data.slice(2, 66)).toString()
                const value = BigInt('0x' + log.data.slice(66, 130)).toString()

                // Try to fetch token info
                let token
                try {
                  const tokenInfoUrl = `${ETHERSCAN_UNIFIED_API}/api?chainid=${chainId}&module=token&action=tokeninfo&contractaddress=${log.address}&apikey=${apiKey}`
                  const tokenRes = await fetch(tokenInfoUrl)
                  const tokenData = await tokenRes.json() as any
                  if (tokenData.result) {
                    token = {
                      symbol: tokenData.result.symbol || 'NFT',
                      name: tokenData.result.name || 'ERC1155 Token',
                      address: log.address,
                      decimals: 0, // ERC1155 doesn't use decimals in the same way
                    }
                  }
                } catch {
                  // Ignore token info errors
                }

                transfers.push({
                  from,
                  to,
                  value,
                  token: token || {
                    symbol: 'ERC1155',
                    name: 'ERC1155 Token',
                    address: log.address,
                    decimals: 0,
                  },
                  tokenId,
                  type: 'erc1155'
                })
              }
            }
          }

          // 4. Parse ERC1155 TransferBatch events
          for (const log of logs) {
            if (log.topics[0] === ERC1155_TRANSFER_BATCH_TOPIC && log.topics.length >= 4) {
              const from = ('0x' + log.topics[2].slice(26)) as string
              const to = ('0x' + log.topics[3].slice(26)) as string

              // Parse data: tokenIds (uint256[]), values (uint256[])
              // This is more complex - we'd need to decode arrays
              // For now, we'll extract what we can
              if (log.data && log.data.length > 130) {
                // Simplified: just record that a batch transfer occurred
                // Full decoding would require ABI decoding
                transfers.push({
                  from,
                  to,
                  value: 'batch',
                  token: {
                    symbol: 'ERC1155',
                    name: 'ERC1155 Batch Transfer',
                    address: log.address,
                    decimals: 0,
                  },
                  type: 'erc1155-batch'
                })
              }
            }
          }

          // Identify victim (lost tokens) and scammer (gained tokens)
          // Focus on fungible transfers (native ETH and ERC20) for financial theft detection
          const balanceChanges = new Map<string, bigint>()

          for (const transfer of transfers) {
            // Only count fungible transfers (native ETH and ERC20) for balance calculations
            // ERC721 and ERC1155 are non-fungible and handled separately
            if (transfer.type === 'native' || transfer.type === 'erc20') {
              const fromBalance = balanceChanges.get(transfer.from) || BigInt(0)
              const toBalance = balanceChanges.get(transfer.to) || BigInt(0)

              try {
                const amount = BigInt(transfer.value)
                balanceChanges.set(transfer.from, fromBalance - amount)
                balanceChanges.set(transfer.to, toBalance + amount)
              } catch {
                // Skip invalid values
              }
            }
          }

          // Find biggest loser (victim) and biggest gainer (scammer)
          let victim: string | null = null
          let scammer: string | null = null
          let maxLoss = BigInt(0)
          let maxGain = BigInt(0)

          for (const [address, change] of balanceChanges.entries()) {
            if (change < 0 && -change > maxLoss) {
              maxLoss = -change
              victim = address
            }
            if (change > 0 && change > maxGain) {
              maxGain = change
              scammer = address
            }
          }

          console.log(`[API] /api/parse-transaction - Success: Found ${transfers.length} transfers`, {
            victim,
            scammer,
            chainId,
            txHash: txHash.slice(0, 10) + '...',
          })

          res.json({
            victim,
            scammer,
            transfers,
            chainId,
            txHash,
          })
        } catch (error: any) {
          console.error('[API] /api/parse-transaction - Unexpected error:', error)
          const errorMessage = error?.message || error?.toString() || 'Failed to parse transaction'
          console.error('[API] /api/parse-transaction - Error details:', {
            message: errorMessage,
            stack: error?.stack,
            chainId: req.body.chainId,
            txHash: req.body.txHash,
          })
          res.status(500).json({ error: errorMessage })
        }
      })

      // Mount Express app as middleware in Vite dev server
      // This handles /api/* routes before Vite's default handlers
      server.middlewares.use(app)
      console.log('[Vite API Plugin] Express middleware mounted. API routes available at /api/*')
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), viteApiPlugin()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer', '@wagmi/core'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-chakra': ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
          'vendor-web3': ['viem', 'wagmi', '@wagmi/core', '@tanstack/react-query'],
          'vendor-appkit': ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
        },
      },
    },
  },
  server: {
    port: 5199,
    host: '0.0.0.0',
    // Remove proxy since API is now handled by the plugin
  },
})
