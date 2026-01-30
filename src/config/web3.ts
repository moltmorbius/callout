import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, arbitrum, optimism, base, bsc } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// PulseChain custom network
const pulsechain = {
  id: 369,
  name: 'PulseChain',
  nativeCurrency: { name: 'PLS', symbol: 'PLS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.pulsechain.com'] },
  },
  blockExplorers: {
    default: { name: 'PulseScan', url: 'https://scan.pulsechain.com' },
  },
} as const satisfies AppKitNetwork

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  pulsechain,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
]

// Reown project ID — get one at https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'demo-project-id'

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
})

// Initialize AppKit in a try/catch so a bad project ID or network error
// doesn't crash the entire module import chain and blank the screen.
let appKit: ReturnType<typeof createAppKit> | null = null
try {
  appKit = createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata: {
      name: 'Callout',
      description: 'Put scammers on blast. On-chain. Forever.',
      url: 'https://callout.city',
      icons: ['https://callout.city/icon.png'],
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-color-mix': '#1a1a2e',
      '--w3m-color-mix-strength': 20,
      '--w3m-accent': '#e74c3c',
    },
  })
} catch (err) {
  console.error('[Callout] AppKit initialization failed:', err)
}

export { appKit, pulsechain }

// Explorer URLs by chain ID
export const explorerUrls: Record<number, string> = {
  1: 'https://etherscan.io',
  369: 'https://ipfs.scan.pulsechain.com',
  137: 'https://polygonscan.com',
  42161: 'https://arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  8453: 'https://basescan.org',
  56: 'https://bscscan.com',
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const base = explorerUrls[chainId] || 'https://etherscan.io'
  return `${base}/tx/${txHash}`
}
