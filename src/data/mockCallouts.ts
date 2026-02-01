import type { Callout } from '../types/callout'

/**
 * Mock callout data for development.
 * Will be replaced by on-chain indexer data in production.
 */
export const mockCallouts: readonly Callout[] = [
  {
    id: '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab01',
    sender: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    target: '0x1234567890aBcDeF1234567890AbCdEf12345678',
    message:
      'This address ran a rug pull on the $SCAM token. Drained 500 ETH from the LP pool after promising a "community-driven project." Do not trust any new tokens deployed by this wallet.',
    timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    chainId: 1,
    txHash: '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab01',
    encrypted: false,
  },
  {
    id: '0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcd02',
    sender: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    target: '0xaBcDeF1234567890AbCdEf1234567890aBcDeF12',
    message:
      'Phishing site operator. Deployed a fake Uniswap frontend at uni-swap-app[.]com that drains wallets on approval. Multiple victims confirmed. Wallet received ~120 ETH in stolen funds.',
    timestamp: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    chainId: 1,
    txHash: '0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcd02',
    encrypted: false,
  },
  {
    id: '0x789abcdef1234567890abcdef1234567890abcdef1234567890abcdef123403',
    sender: '0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF',
    target: '0x9876543210FeDcBa9876543210fEdCbA98765432',
    message:
      'Known honeypot deployer on PulseChain. Creates tokens that can be bought but never sold. Has deployed 15+ honeypots in the last month. Associated with the @FakePulseGems account.',
    timestamp: Math.floor(Date.now() / 1000) - 18000, // 5 hours ago
    chainId: 369,
    txHash: '0x789abcdef1234567890abcdef1234567890abcdef1234567890abcdef123403',
    encrypted: false,
  },
  {
    id: '0x456789abcdef1234567890abcdef1234567890abcdef1234567890abcdef0004',
    sender: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    target: '0xDeAdBeEfDeAdBeEfDeAdBeEfDeAdBeEfDeAdBeEf',
    message: '[ENCRYPTED] 🔒 This message was encrypted by the sender.',
    timestamp: Math.floor(Date.now() / 1000) - 43200, // 12 hours ago
    chainId: 42161,
    txHash: '0x456789abcdef1234567890abcdef1234567890abcdef1234567890abcdef0004',
    encrypted: true,
  },
  {
    id: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde05',
    sender: '0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7',
    target: '0x5555555555555555555555555555555555555555',
    message:
      'Fake NFT marketplace. This contract mimics OpenSea UI but sets unlimited token approvals. Victim lost 2 Bored Apes and 5 Mutants. Contract is a proxy that can change implementation at any time.',
    timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    chainId: 137,
    txHash: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde05',
    encrypted: false,
  },
  {
    id: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba987654306',
    sender: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
    target: '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
    message:
      'Social engineering scammer. Impersonates project team members in Discord DMs. Sends fake "verification" links. Has compromised at least 3 community moderator accounts.',
    timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
    chainId: 8453,
    txHash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba987654306',
    encrypted: false,
  },
  {
    id: '0x1111111111111111111111111111111111111111111111111111111111111107',
    sender: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    target: '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb',
    message:
      'Wash trading bot operator on BSC DEXes. Inflates volume on new tokens to bait retail traders, then dumps. Connected to the "100x Gem Calls" Telegram group.',
    timestamp: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
    chainId: 56,
    txHash: '0x1111111111111111111111111111111111111111111111111111111111111107',
    encrypted: false,
  },
] as const
