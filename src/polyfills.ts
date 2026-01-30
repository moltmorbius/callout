/**
 * Polyfills required for WalletConnect / @reown/appkit on mobile browsers.
 * Must be imported BEFORE any web3 modules.
 */
import { Buffer } from 'buffer'

// Make Buffer available globally (WalletConnect internals expect it)
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}
