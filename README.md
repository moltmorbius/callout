# 📡 Callout

**Put scammers on blast. On-chain. Forever.**

![Screenshot](screenshot-landing.png)

> **📚 [Full Documentation](./docs/)** — User guide, developer setup, templates, and architecture

## What It Does

Callout encodes human-readable messages as UTF-8 hex in transaction input data (calldata), then sends a zero-value transaction to the target address. The message becomes permanently recorded on-chain.

### Use Cases
- **Scammer communication** — Send messages to addresses that stole funds
- **On-chain coordination** — Leave permanent, public messages for any address
- **Proof of communication** — Immutable record that a message was sent

## Features

### Send Callouts
- 🔗 **Wallet Connection** via Reown (WalletConnect) — supports MetaMask, Rainbow, Coinbase, etc.
- 📝 **Pre-written message templates** organized by tone:
  - 🤝 **Cordial** (green) — Professional, assumes good faith
  - ⚠️ **Firm** (yellow) — Assertive with a deadline
  - 🚨 **Hostile** (red) — Maximum pressure, implies consequences
  - ✍️ **Custom** — Write your own
- 😠 **Target Address** — Input with validation
- ↩️ **Return Address** — Auto-injected into templates
- 🔒 **Optional Encryption** — AES-256-GCM encryption with a shared passphrase
- ⛽ **Gas Estimation** — See the cost before sending

### Decrypt Messages
- 🔓 **Tx Hash Lookup** — Paste a transaction hash to fetch and decode calldata
- 📦 **Raw Calldata** — Or paste raw hex calldata directly
- 🔐 **Decrypt Encrypted Messages** — Enter passphrase to unlock

### View the Feed
- 📋 **Live Feed** — See callouts sent FROM an address (proves authorship)
- 🔗 **Connected Wallet Shortcut** — One-click to view your own sent callouts
- 📄 **Pagination** — Load 50 transactions per page
- 🔍 **Explorer Links** — Direct links to view transactions on block explorer

## Supported Networks

- Ethereum Mainnet
- PulseChain
- Polygon
- Arbitrum
- Optimism
- Base
- BSC

## Tech Stack

- React + Vite + TypeScript
- Chakra UI (dark theme)
- viem for blockchain interactions
- Reown/WalletConnect for wallet connection
- Web Crypto API for AES-256-GCM encryption

## Setup

```bash
yarn
yarn run dev
```

### Environment Variables

Create a `.env` file:

```
VITE_REOWN_PROJECT_ID=your-project-id-from-cloud.reown.com
```

Get a free project ID at [cloud.reown.com](https://cloud.reown.com).

## How It Works

### Send a Callout

1. Connect your wallet
2. Enter the target address (scammer/recipient)
3. Choose a message template or write a custom message
4. Optionally encrypt the message with a passphrase
5. Send — the message is encoded as hex calldata in a 0-value transaction
6. The message is now permanently on-chain

### Decrypt a Message

1. Switch to the **"Decrypt"** tab
2. Paste a **transaction hash** (fetches from blockchain) OR **raw calldata hex**
3. Click **"Crack It Open"** to decode as UTF-8
4. If encrypted, enter the passphrase to decrypt

### View the Feed

1. Switch to the **"Feed"** tab
2. Enter an address OR click **"Use My Wallet"** (if connected)
3. Click **"Scan"** to fetch callouts sent FROM that address
4. See all sent messages with previews, timestamps, and explorer links

## Domain

[callout.city](https://callout.city)

## License

MIT
