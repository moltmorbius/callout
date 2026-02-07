import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
  mainnet,
  polygon,
  arbitrum,
  arbitrumNova,
  optimism,
  base,
  bsc,
  avalanche,
  fantom,
  gnosis,
  celo,
  moonbeam,
  moonriver,
  aurora,
  cronos,
  boba,
  metis,
  canto,
  evmos,
  zkSync,
  polygonZkEvm,
  linea,
  scroll,
  manta,
  blast,
  taiko,
  mode,
  zora,
} from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { logError } from '../utils/logger'

// PulseChain custom network
const pulsechain = {
  id: 369,
  name: 'PulseChain',
  nativeCurrency: { name: 'PLS', symbol: 'PLS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.pulsechain.com'] },
  },
  blockExplorers: {
    default: { name: 'PulseScan', url: 'https://ipfs.scan.pulsechain.com' },
  },
} as const satisfies AppKitNetwork

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  pulsechain,
  polygon,
  arbitrum,
  arbitrumNova,
  optimism,
  base,
  bsc,
  avalanche,
  fantom,
  gnosis,
  celo,
  moonbeam,
  moonriver,
  aurora,
  cronos,
  boba,
  metis,
  canto,
  evmos,
  zkSync,
  polygonZkEvm,
  linea,
  scroll,
  manta,
  blast,
  taiko,
  mode,
  zora,
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
  logError('AppKit initialization failed:', err)
}

export { appKit, pulsechain }

// Explorer URLs by chain ID
export const explorerUrls: Record<number, string> = {
  1: 'https://etherscan.io',
  369: 'https://ipfs.scan.pulsechain.com',
  137: 'https://polygonscan.com',
  42161: 'https://arbiscan.io',
  42170: 'https://nova.arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  8453: 'https://basescan.org',
  56: 'https://bscscan.com',
  43114: 'https://snowtrace.io',
  250: 'https://ftmscan.com',
  100: 'https://gnosisscan.io',
  42220: 'https://celoscan.io',
  1284: 'https://moonscan.io',
  1285: 'https://moonriver.moonscan.io',
  1313161554: 'https://explorer.aurora.dev',
  25: 'https://cronoscan.com',
  288: 'https://bobascan.com',
  1088: 'https://andromeda-explorer.metis.io',
  7700: 'https://tuber.build',
  9001: 'https://escan.live',
  324: 'https://explorer.zksync.io',
  1101: 'https://zkevm.polygonscan.com',
  59144: 'https://lineascan.build',
  534352: 'https://scrollscan.com',
  169: 'https://pacific-explorer.manta.network',
  81457: 'https://blastscan.io',
  167000: 'https://taikoscan.io',
  34443: 'https://explorer.mode.network',
  7777777: 'https://explorer.zora.energy',
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const base = explorerUrls[chainId] || 'https://etherscan.io'
  return `${base}/tx/${txHash}`
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const base = explorerUrls[chainId] || 'https://etherscan.io'
  return `${base}/address/${address}`
}
