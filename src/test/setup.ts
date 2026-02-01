/**
 * Vitest global test setup.
 *
 * happy-dom provides a browser-like environment including
 * TextEncoder/TextDecoder and crypto.subtle (Web Crypto API).
 */

// Extend Vitest matchers with jest-dom (toBeInTheDocument, etc.)
import '@testing-library/jest-dom/vitest'

// Ensure crypto.subtle is available for encryption tests.
// happy-dom ships with a globalThis.crypto that includes subtle.
if (typeof globalThis.crypto === 'undefined') {
  // Fallback: import Node's webcrypto (Node 15+)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webcrypto } = require('node:crypto')
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
}
