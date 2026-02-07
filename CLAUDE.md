# Callout Codebase

**Put scammers on blast. On-chain. Forever.**

Callout is a fully client-side decentralized messaging application that enables users to send on-chain messages (callouts) to Ethereum addresses. Messages are encoded as UTF-8 hex in transaction calldata and sent as zero-value transactions, creating permanent, immutable records on the blockchain.

**Stack:** React 19, TypeScript, Vite, Chakra UI, viem/wagmi, Reown AppKit, ECIES encryption

**Structure:** Feature-based component organization with clear separation between UI, logic (utils/services), and configuration layers. Fully client-side with optional Express API backend for transaction parsing.

For detailed architecture, see [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).
