// Polyfills must be loaded before anything else
import './polyfills'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import theme from './config/theme'
import { wagmiAdapter } from './config/web3'
import { ErrorBoundary } from './components/ErrorBoundary'
import { configureLogger } from '@callout/shared/logger'
import { logError } from './utils/logger'
import App from './App'

// Configure shared logger for dev mode
configureLogger({ debug: import.meta.env.DEV })

const queryClient = new QueryClient()

/**
 * Gets the initial color mode for ColorModeScript.
 * Checks localStorage for saved preference, otherwise uses system preference.
 */
function getInitialColorMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'

  try {
    const saved = localStorage.getItem('callout-color-mode-preference')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    if (saved === 'system') {
      // Use system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  } catch {
    // Ignore localStorage errors
  }

  // Default: use system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Catch unhandled promise rejections (e.g. from AppKit network calls)
// so they don't crash the page on mobile
window.addEventListener('unhandledrejection', (event) => {
  logError('Unhandled promise rejection:', event.reason)
  // Prevent the browser from treating this as a fatal error
  event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeScript initialColorMode={getInitialColorMode()} />
    <ErrorBoundary>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider theme={theme}>
            <App />
          </ChakraProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </StrictMode>
)
