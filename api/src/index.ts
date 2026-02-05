import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Parse transaction endpoint
app.post('/api/parse-transaction', async (req, res) => {
  try {
    const { txHash, chainId } = req.body

    if (!txHash || !chainId) {
      return res.status(400).json({ error: 'txHash and chainId are required' })
    }

    const apiKey = process.env.ETHERSCAN_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'Etherscan API key not configured' })
    }

    // Get API URL for chain
    const apiUrl = getEtherscanApiUrl(chainId)
    if (!apiUrl) {
      return res.status(400).json({ error: `Unsupported chain: ${chainId}` })
    }

    // Fetch transaction receipt
    const receiptUrl = `${apiUrl}/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`
    const receiptRes = await fetch(receiptUrl)
    const receiptData = await receiptRes.json() as any

    if (receiptData.error || !receiptData.result) {
      return res.status(404).json({ 
        error: `Transaction not found: ${receiptData.error?.message || 'Unknown error'}` 
      })
    }

    const receipt = receiptData.result
    const logs = receipt.logs || []

    // Parse ERC20 Transfer events
    const transfers: any[] = []
    const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

    for (const log of logs) {
      if (log.topics[0] === ERC20_TRANSFER_TOPIC && log.topics.length >= 3) {
        const from = ('0x' + log.topics[1].slice(26)) as string
        const to = ('0x' + log.topics[2].slice(26)) as string
        const value = BigInt(log.data).toString()

        // Try to fetch token info
        let token
        try {
          const tokenInfoUrl = `${apiUrl}/api?module=token&action=tokeninfo&contractaddress=${log.address}&apikey=${apiKey}`
          const tokenRes = await fetch(tokenInfoUrl)
          const tokenData = await tokenRes.json() as any
          if (tokenData.result) {
            token = {
              symbol: tokenData.result.symbol || 'UNKNOWN',
              name: tokenData.result.name || 'Unknown Token',
              address: log.address,
            }
          }
        } catch {
          // Ignore token info errors
        }

        transfers.push({ from, to, value, token })
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
    res.status(500).json({ error: error.message || 'Failed to parse transaction' })
  }
})

function getEtherscanApiUrl(chainId: number): string | null {
  const urls: Record<number, string> = {
    1: 'https://api.etherscan.io',
    5: 'https://api-goerli.etherscan.io',
    11155111: 'https://api-sepolia.etherscan.io',
    137: 'https://api.polygonscan.com',
    80001: 'https://api-testnet.polygonscan.com',
    42161: 'https://api.arbiscan.io',
    421613: 'https://api-goerli.arbiscan.io',
    10: 'https://api-optimistic.etherscan.io',
    420: 'https://api-goerli-optimistic.etherscan.io',
    8453: 'https://api.basescan.org',
    84531: 'https://api-goerli.basescan.org',
    56: 'https://api.bscscan.com',
    97: 'https://api-testnet.bscscan.com',
  }
  return urls[chainId] || null
}

app.listen(PORT, () => {
  console.log(`Callout API running on port ${PORT}`)
})
