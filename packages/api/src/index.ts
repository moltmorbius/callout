import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

dotenv.config()

// Etherscan unified API endpoint - supports multiple chains via chainid parameter
const ETHERSCAN_UNIFIED_API = 'https://api.etherscan.io/v2'

const app = express()
const PORT = process.env.PORT || 3001

// Get directory paths for serving static files
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// In production: backend runs from api/dist/index.js, frontend is at root/dist/
// So we go up 2 levels from api/dist/ to root, then into dist/
const frontendDistPath = join(__dirname, '../../dist')

// Middleware
app.use(cors())
app.use(express.json())

// Request logging middleware - only log API routes, skip static files
app.use((req, res, next) => {
  // Only log API handler requests, skip static files and SPA routes
  if (req.path.startsWith('/api')) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
    })
  }
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Parse transaction endpoint
app.post('/api/parse-transaction', async (req, res) => {
  console.log(`[parse-transaction] Received request:`, { txHash: req.body.txHash, chainId: req.body.chainId })
  try {
    const { txHash, chainId } = req.body

    if (!txHash || !chainId) {
      return res.status(400).json({ error: 'txHash and chainId are required' })
    }

    const apiKey = process.env.ETHERSCAN_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'Etherscan API key not configured' })
    }

    // Fetch transaction receipt using unified API with chainid parameter
    const receiptUrl = `${ETHERSCAN_UNIFIED_API}/api?chainid=${chainId}&module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`
    const receiptRes = await fetch(receiptUrl)
    const receiptData = await receiptRes.json() as any

    if (receiptData.error || !receiptData.result) {
      const errorMsg = receiptData.error?.message || 'Unknown error'
      // Provide more context about what might be wrong
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
    const logs = receipt.logs || []

    // Parse ERC20 and ERC721 Transfer events (same topic signature)
    const transfers: any[] = []
    const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

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

    // Identify victim (lost tokens) and scammer (gained tokens)
    const balanceChanges = new Map<string, bigint>()

    for (const transfer of transfers) {
      const fromBalance = balanceChanges.get(transfer.from) || BigInt(0)
      const toBalance = balanceChanges.get(transfer.to) || BigInt(0)
      const amount = BigInt(transfer.value)

      balanceChanges.set(transfer.from, fromBalance - amount)
      balanceChanges.set(transfer.to, toBalance + amount)
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

    res.json({
      victim,
      scammer,
      transfers,
      chainId,
      txHash,
    })
  } catch (error: any) {
    console.error('Parse error:', error)
    const errorMessage = error?.message || error?.toString() || 'Failed to parse transaction'
    res.status(500).json({ error: errorMessage })
  }
})


// Serve static frontend files in production
// In development, Vite dev server handles this
// API routes must be defined BEFORE static file serving
if (process.env.NODE_ENV === 'production') {
  // Serve static files from dist folder
  app.use(express.static(frontendDistPath))

  // Serve index.html for all non-API routes (SPA routing)
  // This must be after API routes but will catch all other routes
  app.get('*', (req, res, next) => {
    // Skip API routes - they should have been handled above
    if (req.path.startsWith('/api')) {
      return next()
    }
    res.sendFile(join(frontendDistPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Callout API running on port ${PORT}`)
  if (process.env.NODE_ENV === 'production') {
    console.log(`Serving frontend from ${frontendDistPath}`)
  }
})
