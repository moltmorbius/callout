# 🛠️ Callout Developer Guide

Complete setup, architecture, and contribution guide for Callout developers.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Architecture](#architecture)
7. [Adding Features](#adding-features)
8. [Deployment](#deployment)
9. [Contributing](#contributing)

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (22.x recommended)
- **npm** or **pnpm**
- A code editor (VS Code recommended)
- Git

### Installation

```bash
# Clone the repo
git clone https://github.com/moltmorbius/callout.git
cd callout

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Environment Setup

Edit `.env`:

```env
# Required: Reown (WalletConnect) Project ID
# Get one at https://cloud.reown.com
VITE_REOWN_PROJECT_ID=your-project-id-here
```

**Optional:** For production, you can add:

```env
# Base path for deployment (default: /)
VITE_BASE_PATH=/

# Analytics (optional)
VITE_ANALYTICS_ID=
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

Output: `dist/`

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
callout/
├── src/
│   ├── components/        # React components
│   │   ├── Header.tsx
│   │   ├── MessageComposer.tsx   # Send Callout tab
│   │   ├── DecryptMessage.tsx    # Decrypt tab
│   │   ├── MessageFeed.tsx       # Feed tab
│   │   ├── WalletButton.tsx
│   │   └── ErrorBoundary.tsx
│   ├── services/          # External API integrations
│   │   ├── blockchain.ts  # viem RPC client (tx lookup)
│   │   └── explorer.ts    # BlockScout API (feed)
│   ├── config/            # App configuration
│   │   ├── web3.ts        # Wagmi + Reown setup
│   │   ├── templates.ts   # Message templates
│   │   └── theme.ts       # Chakra UI theme
│   ├── utils/             # Pure utility functions
│   │   ├── encoding.ts    # UTF-8 ↔ hex conversion
│   │   ├── encryption.ts  # AES-256-GCM
│   │   ├── templateEngine.ts  # Variable substitution
│   │   ├── logger.ts
│   │   └── address.test.ts
│   ├── types/             # TypeScript types
│   │   ├── callout.ts     # Core types + chain info
│   │   └── appkit.d.ts    # Reown type augmentation
│   ├── shared/            # Reusable UI primitives
│   │   ├── styles.ts      # Common Chakra styles
│   │   └── SectionLabel.tsx
│   ├── test/              # Test setup
│   │   └── setup.ts
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── polyfills.ts       # Buffer polyfill for browser
├── docs/                  # Documentation (you are here)
├── public/                # Static assets
├── dist/                  # Build output (gitignored)
├── .env                   # Environment (gitignored)
├── .env.example           # Template
├── vite.config.ts         # Vite config
├── vitest.config.ts       # Test config
├── tsconfig.json          # TypeScript config
├── eslint.config.js       # ESLint config
└── package.json
```

---

## Tech Stack

### Core

- **React 19** — UI framework
- **TypeScript 5.9** — Type safety
- **Vite 7** — Build tool & dev server

### Blockchain

- **viem 2.x** — Ethereum library (lightweight, tree-shakeable)
- **wagmi 3.x** — React hooks for wallet connection
- **Reown AppKit 1.8** (formerly WalletConnect) — Wallet modal

### UI

- **Chakra UI 2.x** — Component library
- **Emotion** — CSS-in-JS (Chakra dependency)
- **Framer Motion** — Animations (Chakra dependency)

### Utilities

- **Web Crypto API** — AES-256-GCM encryption (native browser API)
- **Buffer** polyfill — For browser compatibility

### Dev Tools

- **Vitest 4.x** — Unit testing
- **Testing Library** — Component testing
- **ESLint 9** — Linting
- **TypeScript ESLint** — TS-specific rules
- **happy-dom** — Lightweight DOM for tests

---

## Development Workflow

### Code Style

- **TypeScript strict mode** — all code must pass type checks
- **ESLint** — enforced via CI
- **Prettier** — (not configured; Chakra UI uses Emotion, manual formatting)
- **Functional components** — no class components
- **Hooks** — use React hooks, custom hooks for logic
- **Immutable patterns** — prefer `readonly` and const

### Branch Strategy

- `main` — production-ready code
- Feature branches: `feat/feature-name`
- Fixes: `fix/issue-name`
- Docs: `docs/doc-name`

All changes go through pull requests.

### Commit Messages

Use conventional commits:

```
feat: add ECIES encryption
fix: feed pagination infinite loop
docs: update user guide
chore: update dependencies
test: add encryption tests
```

Prefix with `[Pixel 🎨]` for bot commits (convention).

### Pull Request Flow

1. Create a feature branch
2. Make changes
3. Run tests: `npm test`
4. Build: `npm run build`
5. Commit with conventional message
6. Push and open PR
7. Wait for CI (tests + build)
8. Request review from `@morbiuscashdev`
9. Merge when approved

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific file
npm test src/utils/encoding.test.ts

# Coverage (not configured yet)
npm test -- --coverage
```

### Test Structure

Tests live next to the code:

```
src/utils/encoding.ts
src/utils/encoding.test.ts
```

### Writing Tests

Use Vitest + Testing Library:

```ts
import { describe, it, expect } from 'vitest'
import { encodeMessage, decodeMessage } from './encoding'

describe('encodeMessage', () => {
  it('encodes ASCII text to hex', () => {
    const result = encodeMessage('Hello')
    expect(result).toBe('0x48656c6c6f')
  })
})
```

For component tests:

```ts
import { render, screen, fireEvent } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'

function renderComponent() {
  return render(
    <ChakraProvider>
      <MyComponent />
    </ChakraProvider>
  )
}

it('renders button', () => {
  renderComponent()
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

### Mocking

Mock external services in tests:

```ts
import { vi } from 'vitest'

vi.mock('../services/blockchain', () => ({
  fetchTransaction: vi.fn(),
}))
```

### Test Coverage

Aim for >80% coverage on:

- Utils (`src/utils/`)
- Services (`src/services/`)
- Config (`src/config/`)

Components: test critical paths (form submission, wallet connection, etc.).

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details. Key concepts:

### Data Flow

```
User → Component → wagmi/viem → Blockchain
                 ↓
            State (React hooks)
                 ↓
            Update UI
```

### Layers

1. **UI Layer** (`src/components/`) — React components, Chakra UI
2. **Logic Layer** (`src/utils/`, `src/services/`) — Pure functions, API calls
3. **Config Layer** (`src/config/`) — Wagmi, chains, templates
4. **Types Layer** (`src/types/`) — TypeScript definitions

### State Management

- **Local state** — `useState` for component-local data
- **wagmi hooks** — `useAccount`, `useSendTransaction`, `useChainId`
- **No global state** — Reown/wagmi handles wallet state

### API Design

**Blockchain (viem):**
- `fetchTransaction(hash, chainId?)` → fetch tx from RPC
- `isTxHash(input)` → validate tx hash format

**Explorer (BlockScout):**
- `fetchAddressTransactions(address, pagination?)` → get txs FROM address
- `transactionsToCallouts(txs)` → filter & decode calldata

**Encoding:**
- `encodeMessage(text)` → UTF-8 → hex
- `decodeMessage(hex)` → hex → UTF-8
- `isLikelyText(hex)` → heuristic check

**Encryption:**
- `encryptMessage(plaintext, passphrase)` → AES-256-GCM ciphertext
- `decryptMessage(ciphertext, passphrase)` → plaintext
- `isEncryptedMessage(text)` → check for `ENC:` prefix

**Templates:**
- `getTemplatesByCategory(id)` → fetch templates
- `applyTemplate(template, vars)` → substitute `{{placeholders}}`
- `allVariablesFilled(template, vars)` → validation

---

## Adding Features

### Adding a New Chain

1. **Update `src/config/web3.ts`:**

```ts
import { myChain } from 'viem/chains'

export const networks = [
  mainnet,
  pulsechain,
  myChain, // Add here
  // ...
]

export const explorerUrls: Record<number, string> = {
  // ...
  [myChain.id]: 'https://explorer.mychain.com',
}
```

2. **Add chain info to `src/types/callout.ts`:**

```ts
export const CHAIN_INFO: Record<number, ChainInfo> = {
  // ...
  [myChain.id]: {
    name: 'My Chain',
    explorerUrl: 'https://explorer.mychain.com',
    color: '#ff6600',
    emoji: '⚡',
  },
}
```

3. **Test:**
   - Connect wallet on the new chain
   - Send a callout
   - Verify explorer link works

### Adding a Message Template

1. **Edit `src/config/templates.ts`:**

```ts
export const templateCategories = [
  // ...
  {
    id: 'my-category',
    name: 'My Category',
    description: 'Custom templates',
    color: 'blue',
    emoji: '🎯',
  },
]

export const templates: MessageTemplate[] = [
  // ...
  {
    id: 'my-template',
    categoryId: 'my-category',
    name: 'My Template',
    tone: 'cordial',
    content: 'Hello {{target_address}}, please return my funds to {{return_address}}.',
    placeholders: ['target_address', 'return_address'],
  },
]
```

2. **Add tests in `src/config/templates.test.ts`:**

```ts
it('includes my-template', () => {
  const all = getAllTemplates()
  expect(all.some(t => t.id === 'my-template')).toBe(true)
})
```

### Adding a New Tab

1. **Create component:**

```tsx
// src/components/MyTab.tsx
export function MyTab() {
  return (
    <VStack spacing={4}>
      <Text>My new feature!</Text>
    </VStack>
  )
}
```

2. **Import in `App.tsx`:**

```tsx
const MyTab = lazy(() => import('./components/MyTab').then(m => ({ default: m.MyTab })))
```

3. **Add to `<Tabs>`:**

```tsx
<Tab>My Tab</Tab>
// ...
<TabPanel>
  <Suspense fallback={<Spinner />}>
    <MyTab />
  </Suspense>
</TabPanel>
```

### Adding a Service Integration

Example: Add a new blockchain explorer API.

1. **Create service file:**

```ts
// src/services/myexplorer.ts
export async function fetchFromMyExplorer(address: string) {
  const res = await fetch(`https://api.myexplorer.com/txs/${address}`)
  return res.json()
}
```

2. **Add types:**

```ts
export interface MyExplorerTx {
  hash: string
  from: string
  to: string
  input: string
}
```

3. **Write tests:**

```ts
// src/services/myexplorer.test.ts
import { fetchFromMyExplorer } from './myexplorer'

it('fetches transactions', async () => {
  const data = await fetchFromMyExplorer('0x...')
  expect(data).toHaveProperty('hash')
})
```

4. **Use in component:**

```tsx
import { fetchFromMyExplorer } from '../services/myexplorer'

function MyComponent() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchFromMyExplorer('0x...').then(setData)
  }, [])
}
```

---

## Deployment

### Build

```bash
npm run build
```

Output in `dist/`.

### Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect GitHub repo to Vercel dashboard.

**Environment variables:**
- Add `VITE_REOWN_PROJECT_ID` in Vercel dashboard
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

### Deploying to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

Or drag `dist/` folder into Netlify dashboard.

**Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Add env var: `VITE_REOWN_PROJECT_ID`

### Deploying to GitHub Pages

(Not recommended due to base path issues, but possible)

```bash
# Set base in vite.config.ts
export default defineConfig({
  base: '/callout/',
})

# Build
npm run build

# Deploy
gh-pages -d dist
```

### Domain Setup

For custom domain (e.g., `callout.city`):

1. **DNS:** Add A record or CNAME to your host
2. **Vercel/Netlify:** Add custom domain in dashboard
3. **SSL:** Auto-provisioned by host

---

## Contributing

### Code of Conduct

- Be respectful
- No spam, harassment, or illegal activity
- Keep discussions on-topic

### How to Contribute

1. **Fork the repo**
2. **Create a feature branch:** `git checkout -b feat/my-feature`
3. **Make changes**
4. **Write tests** (if applicable)
5. **Run tests:** `npm test`
6. **Build:** `npm run build`
7. **Commit:** Use conventional commits
8. **Push:** `git push origin feat/my-feature`
9. **Open a PR** on GitHub
10. **Request review** from maintainers

### What to Contribute

Good first issues:

- 🐛 **Bug fixes** — check GitHub Issues
- 📝 **Documentation** — improve guides, fix typos
- ✨ **New templates** — add message templates
- 🎨 **UI polish** — improve styling, animations
- 🧪 **Tests** — increase coverage

Larger features:

- **Multi-chain feed support** (Ethereum, Polygon, etc.)
- **ECIES encryption** (asymmetric, no shared passphrase)
- **CalloutRegistry contract** (for indexing)
- **Inbox view** (messages TO you, not FROM)
- **Custom template creation** (save your own)

### Maintainers

- **@morbiuscashdev** — CEO, primary reviewer
- **@clawdmorbius** — AI assistant (bot)

### Review Process

1. PR opened → CI runs (tests + build)
2. Maintainer reviews code
3. Feedback → you address it
4. Approved → squash merge to `main`
5. Deploy → auto-deploys to production

---

## Troubleshooting Dev Issues

### TypeScript Errors

**Problem:** `Type 'X' is not assignable to type 'Y'`

**Solutions:**
- Check `tsconfig.json` for strict settings
- Ensure imports are correct
- Run `npx tsc --noEmit` to see all errors
- Check viem/wagmi type definitions

### Build Fails

**Problem:** `npm run build` fails with error

**Common causes:**
- TypeScript errors (run `npx tsc --noEmit`)
- Missing dependencies (run `npm install`)
- Out of memory (increase Node heap: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`)

### Tests Fail

**Problem:** `npm test` shows failures

**Solutions:**
- Check if mocks are set up correctly
- Verify happy-dom is installed
- Run individual test: `npm test <file>`
- Check for async timing issues

### Wallet Connection Fails in Dev

**Problem:** WalletConnect doesn't work locally

**Solutions:**
- Check `.env` has valid `VITE_REOWN_PROJECT_ID`
- Clear browser cache
- Try incognito mode
- Check console for CORS errors
- Ensure localhost is allowed in Reown dashboard

### Hot Reload Not Working

**Problem:** Changes don't reflect after save

**Solutions:**
- Restart dev server: `npm run dev`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check file watcher limits (Linux): `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`

---

## Resources

### Official Docs

- **Viem:** https://viem.sh
- **Wagmi:** https://wagmi.sh
- **Reown AppKit:** https://docs.reown.com/appkit
- **Chakra UI:** https://chakra-ui.com
- **Vitest:** https://vitest.dev

### Community

- **Discord:** https://discord.com/invite/clawd
- **GitHub:** https://github.com/moltmorbius/callout
- **Twitter:** @callout_city *(if active)*

### Learn More

- [Ethereum Development Basics](https://ethereum.org/developers)
- [Viem vs Ethers](https://viem.sh/docs/ethers-migration)
- [React + TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)

---

Happy building! 🚀
