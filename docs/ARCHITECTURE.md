# 🏗️ Callout Architecture

Technical overview of Callout's design, data flow, and key decisions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Data Flow](#data-flow)
4. [Key Components](#key-components)
5. [External Services](#external-services)
6. [Security](#security)
7. [Performance](#performance)
8. [Design Decisions](#design-decisions)

---

## System Overview

Callout is a **fully client-side** decentralized messaging app. There is no backend server — all logic runs in the browser.

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│          Browser (React App)            │
│  ┌─────────────────────────────────┐   │
│  │  UI Layer (Chakra UI)           │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Logic Layer (Utils/Services)   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Web3 Layer (viem/wagmi)        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
           ↓            ↓            ↓
     ┌────────┐    ┌────────┐  ┌─────────┐
     │ Wallet │    │  RPC   │  │ Explorer│
     │ (MM)   │    │ (viem) │  │  API    │
     └────────┘    └────────┘  └─────────┘
           ↓            ↓            ↓
     ┌────────────────────────────────────┐
     │         Blockchain (Ethereum)      │
     └────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite 7
- **Language:** TypeScript 5.9
- **UI Library:** Chakra UI 2.x
- **Web3 Library:** viem 2.x + wagmi 3.x
- **Wallet Connection:** Reown AppKit 1.8 (WalletConnect)
- **Encryption:** Web Crypto API (AES-256-GCM)
- **Testing:** Vitest 4.x + Testing Library
- **Deployment:** Static hosting (Vercel, Netlify, etc.)

---

## Architecture Layers

Callout follows a layered architecture with clear separation of concerns.

### 1. UI Layer (`src/components/`)

**Responsibility:** Render UI, handle user input, manage local state.

**Components:**
- `App.tsx` — Root component, tab routing
- `MessageComposer.tsx` — Send Callout tab
- `DecryptMessage.tsx` — Decrypt tab
- `MessageFeed.tsx` — Feed tab
- `WalletButton.tsx` — Wallet connection UI
- `Header.tsx` — App header
- `ErrorBoundary.tsx` — Error handling

**Patterns:**
- Functional components + hooks
- Chakra UI for styling (no CSS files)
- Local state via `useState`
- Side effects via `useEffect`
- No global state (wagmi manages wallet state)

### 2. Logic Layer (`src/utils/`, `src/services/`)

**Responsibility:** Business logic, data transformation, API calls.

**Modules:**

**Utils (Pure Functions):**
- `encoding.ts` — UTF-8 ↔ hex conversion
- `encryption.ts` — AES-256-GCM encrypt/decrypt
- `templateEngine.ts` — Variable substitution
- `logger.ts` — Console logging

**Services (Side Effects):**
- `blockchain.ts` — viem public client, tx lookup
- `explorer.ts` — BlockScout API calls, calldata filtering

**Patterns:**
- Pure functions wherever possible
- Explicit error handling (try/catch, throw)
- No side effects in utils
- Services return Promises

### 3. Config Layer (`src/config/`)

**Responsibility:** Static configuration, constants.

**Modules:**
- `web3.ts` — Wagmi, Reown, chains, explorer URLs
- `templates.ts` — Message templates + categories
- `theme.ts` — Chakra UI theme

**Patterns:**
- Export const values
- Type-safe (TypeScript)
- Centralized config (no scattered constants)

### 4. Types Layer (`src/types/`)

**Responsibility:** TypeScript type definitions.

**Modules:**
- `callout.ts` — Core types (Callout, ChainInfo, etc.)
- `appkit.d.ts` — Type augmentation for Reown

**Patterns:**
- `readonly` properties for immutability
- Interface over type (for extensibility)
- Co-located with related code when specific to one module

---

## Data Flow

### Sending a Callout

```
User fills form
     ↓
State updates (useState)
     ↓
Click "Send Callout"
     ↓
encodeMessage(text) → hex calldata
     ↓
(optional) encryptMessage(plaintext, passphrase)
     ↓
useSendTransaction (wagmi)
     ↓
Wallet prompts user
     ↓
User approves
     ↓
Transaction sent to blockchain
     ↓
Wait for confirmation
     ↓
Show success + explorer link
```

**Key functions:**
1. `encodeMessage(text: string)` → `0x...` hex
2. (optional) `encryptMessage(plaintext, passphrase)` → ciphertext
3. `sendTransaction({ to, value: 0, data })` → tx hash

### Decrypting a Message

```
User pastes tx hash or calldata
     ↓
State updates (useState)
     ↓
Click "Crack It Open"
     ↓
If tx hash:
  fetchTransaction(hash) → tx object
  Extract tx.input (calldata)
Else:
  Use raw calldata
     ↓
decodeMessage(hex) → UTF-8 text
     ↓
Check if encrypted (starts with "ENC:")
     ↓
If encrypted:
  User enters passphrase
  decryptMessage(ciphertext, passphrase) → plaintext
     ↓
Display message
```

**Key functions:**
1. `isTxHash(input)` → boolean
2. `fetchTransaction(hash)` → tx object
3. `decodeMessage(hex)` → UTF-8 text
4. `isEncryptedMessage(text)` → boolean
5. (optional) `decryptMessage(ciphertext, passphrase)` → plaintext

### Viewing the Feed

```
User enters address OR clicks "Use My Wallet"
     ↓
State updates (useState)
     ↓
Click "Scan"
     ↓
fetchAddressTransactions(address) → BlockScout response
     ↓
Filter transactions:
  - Has raw_input (calldata)
  - Decode as UTF-8
  - isLikelyText(hex) → boolean
     ↓
transactionsToCallouts(txs) → Callout[]
     ↓
Render CalloutCard components
     ↓
User clicks "Load more" → fetch next page → append
```

**Key functions:**
1. `fetchAddressTransactions(address, pagination?)` → BlockScoutTxListResponse
2. `tryDecodeCalldata(rawInput)` → string | null
3. `transactionsToCallouts(txs)` → Callout[]

---

## Key Components

### MessageComposer

**Purpose:** Send Callout tab — compose and send on-chain messages.

**State:**
- `targetAddress` — recipient address
- `customMessage` — user's custom message
- `selectedTemplate` — chosen template ID
- `templateVars` — variable values
- `encryptEnabled` — encryption toggle
- `passphrase` — encryption key

**Hooks:**
- `useAccount()` — get connected wallet
- `useChainId()` — current chain
- `useSendTransaction()` — send tx
- `useEstimateGas()` — gas estimate

**Flow:**
1. User selects template or writes custom message
2. Fill in variables (if template)
3. Toggle encryption (optional)
4. Review gas estimate
5. Click "Send Callout"
6. Approve tx in wallet
7. Wait for confirmation
8. Show success message + explorer link

### DecryptMessage

**Purpose:** Decrypt tab — decode calldata or fetch tx by hash.

**State:**
- `inputValue` — tx hash or raw calldata
- `decodedMessage` — UTF-8 decoded text
- `decryptedMessage` — decrypted plaintext (if encrypted)
- `txMeta` — tx metadata (from, to, chain)
- `passphrase` — decryption key

**Features:**
- Auto-detect input type (tx hash vs calldata)
- Fetch from blockchain if tx hash
- Decode calldata as UTF-8
- Detect encrypted messages (ENC: prefix)
- Decrypt with passphrase

**Flow:**
1. User pastes tx hash or calldata
2. Badge shows input type
3. Click "Crack It Open"
4. If tx hash → fetch via `fetchTransaction()`
5. Decode calldata → UTF-8
6. If encrypted → prompt for passphrase
7. Decrypt → show plaintext

### MessageFeed

**Purpose:** Feed tab — show callouts sent FROM an address.

**State:**
- `addressInput` — search address
- `searchedAddress` — currently displayed address
- `callouts` — array of Callout objects
- `nextPage` — pagination params
- `isLoading` — loading state

**Features:**
- Search by address
- "Use My Wallet" quick-fill button
- Pagination (50 per page)
- Callout cards with preview
- Encrypted message detection

**Flow:**
1. User enters address or clicks "Use My Wallet"
2. Click "Scan"
3. Fetch txs from BlockScout API
4. Filter for decodable calldata
5. Render CalloutCard components
6. Click "Load more" → fetch next page

---

## External Services

### 1. Blockchain RPC (viem)

**Purpose:** Read blockchain data directly.

**Endpoint:** Chain-specific RPC (e.g., `https://rpc.pulsechain.com`)

**Used for:**
- Fetching transactions by hash
- Estimating gas
- Reading block data

**Implementation:**
```ts
// src/services/blockchain.ts
import { createPublicClient, http } from 'viem'

const client = createPublicClient({
  chain: pulsechain,
  transport: http()
})

const tx = await client.getTransaction({ hash })
```

**Caching:** Client instances are cached per chain ID.

**Fallback:** Tries multiple chains if chain ID not specified.

### 2. BlockScout API (PulseChain)

**Purpose:** Index and query transactions for an address.

**Endpoint:** `https://api.scan.pulsechain.com/api/v2`

**Used for:**
- Fetching transactions FROM an address
- Pagination support
- Filtering by transaction type

**Implementation:**
```ts
// src/services/explorer.ts
const url = `https://api.scan.pulsechain.com/api/v2/addresses/${address}/transactions?type=from`
const res = await fetch(url)
const data = await res.json()
```

**Rate limits:** No authentication required, but rate limits apply (unknown exact limit).

**Pagination:** Uses `next_page_params` object passed as query params.

### 3. Reown (WalletConnect)

**Purpose:** Wallet connection UI.

**Endpoint:** `https://cloud.reown.com`

**Used for:**
- Wallet modal
- QR code generation
- Multi-wallet support

**Implementation:**
```ts
// src/config/web3.ts
import { createAppKit } from '@reown/appkit/react'

const appKit = createAppKit({
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
  networks,
  adapters: [wagmiAdapter],
})
```

**API Key:** Required (`VITE_REOWN_PROJECT_ID`). Get free at [cloud.reown.com](https://cloud.reown.com).

---

## Security

### Client-Side Only

**Advantages:**
- No backend to hack
- No data stored on servers
- Fully decentralized

**Risks:**
- Private keys managed by wallet (not Callout)
- Calldata is public (use encryption for sensitive info)

### Encryption (AES-256-GCM)

**Algorithm:** AES-256-GCM (Galois/Counter Mode)

**Key derivation:** PBKDF2 with 100,000 iterations

**Implementation:**
```ts
// src/utils/encryption.ts
const key = await window.crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  rawKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
)

const encrypted = await window.crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
)
```

**Security notes:**
- Random IV (initialization vector) per message
- Salt included in ciphertext
- No plaintext storage
- Passphrase never leaves client

**Limitations:**
- Symmetric encryption (shared passphrase)
- Passphrase must be shared out-of-band
- Future: ECIES (asymmetric) planned

### Input Validation

**Address validation:**
```ts
import { isAddress } from 'viem'

if (!isAddress(input)) {
  throw new Error('Invalid address')
}
```

**Tx hash validation:**
```ts
function isTxHash(input: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(input)
}
```

**Calldata filtering:**
```ts
function isLikelyText(hex: `0x${string}`): boolean {
  const text = decodeMessage(hex)
  const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, '')
  return printable.length / text.length > 0.8
}
```

### CORS & CSP

**CORS:** Not applicable (client-side only, no backend API)

**Content Security Policy (CSP):**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               connect-src 'self' https://rpc.pulsechain.com https://api.scan.pulsechain.com https://cloud.reown.com">
```

(Not currently enforced, but recommended for production)

---

## Performance

### Bundle Size

**Current (production build):**
- Total: ~3.5 MB (uncompressed)
- Gzipped: ~850 KB
- Largest chunks:
  - `vendor-appkit`: 940 KB (Reown UI)
  - `vendor-web3`: 340 KB (viem + wagmi)
  - `vendor-chakra`: 340 KB (Chakra UI)

**Optimization strategies:**
- Code splitting (lazy-loaded tabs)
- Tree shaking (ES modules)
- Minification (Vite default)
- Compression (gzip/brotli on host)

### Lazy Loading

**Tabs are lazy-loaded:**
```tsx
const DecryptMessage = lazy(() =>
  import('./components/DecryptMessage').then(m => ({ default: m.DecryptMessage }))
)
```

Only loads when user switches to that tab.

### Caching

**viem client instances:**
```ts
const clientCache = new Map<number, PublicClient>()

function getClient(chainId: number) {
  if (!clientCache.has(chainId)) {
    clientCache.set(chainId, createPublicClient(...))
  }
  return clientCache.get(chainId)
}
```

**No other caching** (stateless app, no localStorage usage yet).

### API Rate Limits

**BlockScout API:**
- No documented limit
- Assumed: ~10 req/sec
- Pagination limits server load (50 items/page)

**Reown:**
- Free tier: 10,000 requests/month
- Sufficient for small-medium traffic

---

## Design Decisions

### Why viem instead of ethers.js?

**Reasons:**
- **Smaller bundle size** (~30% smaller than ethers)
- **Tree-shakeable** (only import what you use)
- **TypeScript-first** (better type inference)
- **Modern** (uses native `bigint`, no BigNumber wrapper)
- **wagmi integration** (wagmi uses viem internally)

### Why client-side only?

**Reasons:**
- **Decentralization** — no server to shut down
- **Privacy** — no data collection, no analytics
- **Cost** — free hosting (static site)
- **Simplicity** — no backend to maintain

**Tradeoffs:**
- Relies on external APIs (BlockScout, Reown)
- Limited indexing capabilities (PulseChain only for now)
- Can't do server-side filtering or search

### Why Chakra UI?

**Reasons:**
- **Accessibility** (ARIA labels, keyboard nav)
- **Dark theme** (matches crypto app aesthetic)
- **TypeScript support** (fully typed)
- **Composable** (build custom components easily)
- **No CSS files** (all styles in JS)

**Tradeoffs:**
- Large bundle size (~340 KB)
- Opinionated design system
- Emotion dependency (CSS-in-JS overhead)

### Why BlockScout instead of Etherscan?

**Reasons:**
- **No API key required** (for PulseChain)
- **Open source** (Blockscout is FOSS)
- **PulseChain support** (Etherscan doesn't support PulseChain)

**Tradeoffs:**
- Only one chain supported (PulseChain)
- No historical data older than BlockScout deployment
- Reliability depends on BlockScout uptime

### Why AES-GCM instead of ECIES?

**Current:** AES-256-GCM (symmetric)

**Reason:** Simpler to implement, Web Crypto API native support.

**Future:** ECIES (asymmetric) planned for:
- No shared passphrase needed
- Encrypt with recipient's public key
- Decrypt with recipient's private key

**Challenge:** No standard "encryption public key" in Ethereum wallets (EIP-5630 not widely supported).

**Workaround:** Sign-to-derive pattern (recipient signs canonical message → derive key pair).

### Why no global state management (Redux, Zustand)?

**Reason:**
- **wagmi handles wallet state** (connected account, chain, balance)
- **Components own their state** (form inputs, loading flags)
- **No shared state needed** (tabs are independent)

**Benefits:**
- Simpler code (less boilerplate)
- Easier to reason about (local state only)
- Smaller bundle (no state library)

**When to add:** If multiple components need to share complex state (e.g., multi-step wizard, global notifications).

---

## Future Improvements

### Multi-Chain Feed Support

**Goal:** Support Ethereum, Polygon, Arbitrum, etc. in the Feed tab.

**Challenge:** Etherscan API requires key (paid for high volume).

**Solution:**
1. Deploy a simple backend proxy
2. Store Etherscan API key server-side
3. Client → Backend → Etherscan API
4. Or: use a serverless function (Vercel, Netlify Functions)

### ECIES Encryption

**Goal:** Asymmetric encryption (no shared passphrase).

**Implementation:**
1. Recipient signs canonical message → derive key pair
2. Store public key on-chain (or recoverable from signature)
3. Sender encrypts with recipient's public key
4. Recipient decrypts by re-signing the same message

**Benefits:**
- No out-of-band passphrase sharing
- More secure (recipient's key never leaves their wallet)

### CalloutRegistry Contract

**Goal:** Emit events for indexing.

**Design:**
```solidity
contract CalloutRegistry {
  event MessageSent(
    address indexed from,
    address indexed to,
    bytes message,
    bool encrypted
  );

  function sendMessage(address to, bytes calldata message, bool encrypted) external {
    emit MessageSent(msg.sender, to, message, encrypted);
    // Optionally forward 0-value call to target
  }
}
```

**Indexing:** Use Ponder, The Graph, or Envio to index events → GraphQL API.

**Benefits:**
- Fast queries (no block scanning)
- Multi-chain support (deploy on all chains)
- Inbox view (messages TO you)

### Inbox View

**Goal:** Show messages sent TO your address.

**Implementation:**
1. Query CalloutRegistry events where `to == connectedAddress`
2. Display as inbox (sender, message, timestamp)
3. Filter by encrypted/unencrypted

**UI:**
- New tab: "Inbox"
- Similar to Feed, but filters by `to` instead of `from`

---

## Glossary

- **Calldata:** Transaction input data (hex-encoded)
- **Callout:** On-chain message sent via calldata
- **EOA:** Externally Owned Account (user wallet)
- **ERC-20:** Token standard
- **Reown:** Formerly WalletConnect (wallet connection protocol)
- **viem:** TypeScript Ethereum library
- **wagmi:** React hooks for Ethereum
- **BlockScout:** Open-source block explorer
- **ECIES:** Elliptic Curve Integrated Encryption Scheme

---

## Resources

### Code

- **GitHub:** https://github.com/moltmorbius/callout
- **Live App:** https://callout.city

### Documentation

- **User Guide:** [USER_GUIDE.md](./USER_GUIDE.md)
- **Developer Guide:** [DEVELOPER.md](./DEVELOPER.md)
- **Templates:** [TEMPLATES.md](./TEMPLATES.md)

### External Docs

- **viem:** https://viem.sh
- **wagmi:** https://wagmi.sh
- **Reown:** https://docs.reown.com
- **Chakra UI:** https://chakra-ui.com
- **BlockScout API:** https://docs.blockscout.com/devs/apis

---

**Questions?** Open an issue on GitHub or join the Discord.
