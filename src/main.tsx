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
import { logError } from './utils/logger'
import App from './App'

const queryClient = new QueryClient()

// Catch unhandled promise rejections (e.g. from AppKit network calls)
// so they don't crash the page on mobile
window.addEventListener('unhandledrejection', (event) => {
  logError('Unhandled promise rejection:', event.reason)
  // Prevent the browser from treating this as a fatal error
  event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
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
