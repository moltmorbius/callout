# 📡 Callout User Guide

**Put scammers on blast. On-chain. Forever.**

## Table of Contents

1. [What is Callout?](#what-is-callout)
2. [Getting Started](#getting-started)
3. [Sending a Callout](#sending-a-callout)
4. [Decrypting Messages](#decrypting-messages)
5. [Viewing the Feed](#viewing-the-feed)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## What is Callout?

Callout is a decentralized messaging app that lets you send permanent, on-chain messages to any Ethereum-compatible address. Your message is encoded as UTF-8 hex in transaction calldata and stored forever on the blockchain.

### Use Cases

- **Call out scammers** — Send public messages to addresses that stole your funds
- **Prove authorship** — Show that you sent specific messages from your wallet
- **On-chain coordination** — Leave permanent messages for any address
- **Immutable records** — Create verifiable proof of communication

### How It Works

1. You type a message
2. It's encoded as UTF-8 hex
3. Sent as calldata in a 0-value transaction to the target address
4. Permanently recorded on the blockchain
5. Anyone can decode and read it

---

## Getting Started

### 1. Visit the App

Go to [callout.city](https://callout.city)

### 2. Connect Your Wallet

Click **"Connect Wallet"** in the top right. Callout supports:

- MetaMask
- Rainbow
- Coinbase Wallet
- WalletConnect-compatible wallets
- Any browser extension wallet

### 3. Select a Network

Callout supports 7 chains:

- **PulseChain** (recommended — low fees, fast)
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- BSC

Switch networks in your wallet before sending.

---

## Sending a Callout

### Step-by-Step

1. **Connect your wallet** (if not already connected)
2. Go to the **"Send Callout"** tab (default view)
3. **Enter the target address** — the scammer or recipient
4. **Choose a message:**
   - **Pick a template** (Cordial, Firm, or Hostile)
   - **Write a custom message**
5. **(Optional) Encrypt the message** with a passphrase
6. **Review gas estimate** — see the transaction cost
7. **Click "Send Callout"**
8. **Approve the transaction** in your wallet
9. **Done!** Your message is now on-chain

### Message Templates

Callout includes pre-written templates organized by tone:

#### 🤝 Cordial (Green)
Professional, assumes good faith. Examples:
- **White Hat Bounty Offer** — offer to return funds for a reward
- **Accidental Send** — ask for return of mistakenly sent funds

#### ⚠️ Firm (Yellow)
Assertive with a deadline. Examples:
- **Formal Demand** — demand return within X days
- **Legal Notice** — mention lawyers/authorities

#### 🚨 Hostile (Red)
Maximum pressure, implies consequences. Examples:
- **Final Warning** — threat of legal action
- **Public Callout** — name and shame

#### ✍️ Custom
Write your own message from scratch.

### Template Variables

Templates support variable placeholders that auto-fill:

- `{{return_address}}` — Your connected wallet address
- `{{target_address}}` — The recipient's address
- `{{amount}}` — Amount stolen/owed
- `{{deadline}}` — Deadline date

Example:
```
Return {{amount}} ETH to {{return_address}} by {{deadline}} or face legal action.
```

You can edit the template text before sending.

### Encryption

If you want privacy:

1. Toggle **"Encrypt message"** ON
2. Enter a **passphrase**
3. Share the passphrase with the recipient out-of-band (Signal, email, etc.)

The message is encrypted client-side using AES-256-GCM before being sent on-chain. Only someone with the passphrase can decrypt it.

**Warning:** Encryption is experimental. For maximum security, use this for sensitive content only. The passphrase is never stored.

---

## Decrypting Messages

Found a callout transaction and want to read it? Use the **Decrypt** tab.

### Decode from Transaction Hash

1. Go to the **"Decrypt"** tab
2. **Paste a transaction hash** (66 characters, starts with `0x`)
3. Click **"Crack It Open"**
4. The app fetches the transaction from the blockchain via RPC
5. Decodes the calldata as UTF-8 text
6. If encrypted, enter the passphrase to decrypt

**Example:**
```
0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
```

### Decode from Raw Calldata

Already have the calldata hex?

1. Go to the **"Decrypt"** tab
2. **Paste the raw hex calldata**
3. Click **"Crack It Open"**
4. Decoded instantly

**Example:**
```
0x48656c6c6f2c20776f726c6421
```
Decodes to: `Hello, world!`

### Encrypted Messages

If the message is encrypted, you'll see:

```
🔒 Encrypted message detected
Enter the passphrase to unlock.
```

1. Enter the passphrase
2. Click **"Unlock"**
3. See the plaintext

---

## Viewing the Feed

The **Feed** tab shows callout messages sent **from** an address — proving you're the sender.

### Why FROM, not TO?

When a hacker receives your callout, they can check the feed to verify you actually own the wallet that sent it. This proves authorship and legitimacy.

### Using the Feed

1. Go to the **"Feed"** tab
2. **Enter an address** OR click **"Use My Wallet"** (if connected)
3. Click **"Scan"**
4. The app fetches transactions from PulseChain's BlockScout API
5. Filters for readable text calldata
6. Shows callouts as cards (newest first)

### Feed Cards

Each callout card shows:

- **Sender** (FROM address)
- **Target** (TO address)
- **Chain** (PulseChain by default)
- **Timestamp** (when it was sent)
- **Message preview** (first 200 chars)
- **Encrypted badge** (if message is encrypted)
- **View TX** link (opens in block explorer)

### Pagination

The feed loads 50 transactions per page.

- If more exist, click **"Load more callouts"**
- Scans the next 50 transactions
- Appends to the feed

### Empty Feed

No callouts found? Possible reasons:

1. **No transactions** — the address hasn't sent any txs
2. **No calldata messages** — transactions exist but don't contain text
3. **Different chain** — the feed only scans PulseChain (for now)

---

## Advanced Features

### Gas Estimation

Before sending, Callout estimates the gas cost:

- **Encryption adds ~10-20% gas** (larger calldata)
- **Longer messages = higher cost** (more bytes)
- Estimate shown in real-time as you type

### Return Address Injection

When using templates, your **connected wallet address** is automatically injected as `{{return_address}}`.

This proves to the recipient that the message came from your wallet.

### Multi-Chain Support

Callout works on 7 chains, but features vary:

| Feature | PulseChain | Other Chains |
|---------|------------|--------------|
| Send Callout | ✅ | ✅ |
| Decrypt | ✅ | ✅ |
| Feed | ✅ | ❌ (coming soon) |

**Why PulseChain first?**
- Low gas fees (~$0.0001 per tx)
- No API key required for BlockScout
- Fast block times

Support for other chains in the Feed tab requires backend integration (Etherscan API keys).

---

## Best Practices

### Writing Effective Callouts

1. **Be clear and specific** — state exactly what you want
2. **Include a deadline** — creates urgency
3. **Provide a return address** — make it easy for them to comply
4. **Stay professional** — emotional messages are less effective
5. **Keep it concise** — shorter = cheaper gas

### Security Tips

1. **Never share your wallet private key** — Callout only needs wallet connection
2. **Double-check the target address** — transactions are irreversible
3. **Use encryption for sensitive info** — don't broadcast private details
4. **Verify calldata before signing** — your wallet shows the raw hex

### Cost Optimization

1. **Use PulseChain** — lowest fees
2. **Keep messages short** — fewer bytes = less gas
3. **Avoid encryption unless needed** — adds overhead
4. **Check gas prices** — send during low-traffic periods

---

## Troubleshooting

### Wallet Won't Connect

**Problem:** "Connect Wallet" button does nothing or shows error

**Solutions:**
- Refresh the page
- Make sure your wallet extension is unlocked
- Try a different wallet (MetaMask, Rainbow, etc.)
- Clear browser cache and retry
- Check that you're on a supported network

### Transaction Fails

**Problem:** Transaction rejected or reverts

**Common causes:**
- **Insufficient gas** — increase gas limit in wallet
- **Insufficient funds** — need ETH/PLS for gas (even though message value is 0)
- **Wrong network** — switch to the chain you selected in Callout
- **Contract interaction blocked** — some wallets block 0-value txs with data (rare)

**Solutions:**
- Check your gas balance on the selected chain
- Retry with higher gas limit
- Switch networks and try again

### Message Won't Decrypt

**Problem:** "Decryption failed. Wrong passphrase or corrupted data."

**Causes:**
- **Wrong passphrase** — case-sensitive, must match exactly
- **Not encrypted** — the message is plaintext (check if it says "Encrypted message detected")
- **Corrupted calldata** — hex string is incomplete or malformed

**Solutions:**
- Verify the passphrase with the sender
- Try decoding without decryption first (to see if it's plaintext)
- Re-fetch the transaction hash (if you used raw calldata)

### Feed Shows No Results

**Problem:** "No callouts found" even though you sent some

**Possible reasons:**
1. **Wrong address** — make sure you're searching the FROM address (your wallet)
2. **Different chain** — the feed only scans PulseChain
3. **Sent as contract call** — if you sent through a contract, it won't show as FROM your EOA
4. **Recent transaction** — wait ~30 seconds for indexing

**Solutions:**
- Click "Use My Wallet" to auto-fill your connected address
- Check that the transaction succeeded on PulseChain
- Paste your tx hash in the Decrypt tab to verify it worked

### Empty Input / Blank Screen

**Problem:** App loads but shows blank content

**Solutions:**
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Disable browser extensions (especially ad blockers)
- Try incognito/private mode
- Clear site data and reload

### High Gas Costs

**Problem:** Sending a callout costs too much

**Solutions:**
- **Switch to PulseChain** — gas is ~1000x cheaper than Ethereum
- **Shorten your message** — every byte costs gas
- **Disable encryption** — saves ~10-20% gas
- **Wait for low gas periods** — use gas trackers

---

## Need Help?

- **Discord:** [discord.com/invite/clawd](https://discord.com/invite/clawd)
- **GitHub Issues:** [github.com/moltmorbius/callout/issues](https://github.com/moltmorbius/callout/issues)
- **Twitter:** [@callout_city](https://twitter.com/callout_city) *(if active)*

---

## Privacy & Legal

**On-Chain Data is Public:**
All unencrypted callouts are visible to anyone with a block explorer. Treat them as public broadcasts.

**Disclaimer:**
Callout is a tool for on-chain communication. Users are responsible for the legality of their messages. Do not use for harassment, threats, or illegal activity.

**No Censorship:**
Once a message is on-chain, it cannot be deleted or modified. Think before you send.

---

## What's Next?

- [ ] Multi-chain feed support (Ethereum, Polygon, etc.)
- [ ] ECIES encryption (use recipient's public key)
- [ ] CalloutRegistry contract (for indexing)
- [ ] Inbox view (messages sent TO you)
- [ ] Custom templates (save your own)

Stay tuned! 🚀
