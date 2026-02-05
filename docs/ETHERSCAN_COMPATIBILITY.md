# Etherscan IDM Compatibility

## Input Data Messages (IDM)

Callout is fully compatible with Etherscan's Input Data decoder.

### How It Works

1. **Encoding:** Message → UTF-8 bytes → Hex string (with `0x` prefix)
2. **Transaction:** Zero-value transaction with encoded message as calldata
3. **Etherscan:** Automatically detects UTF-8 text and displays in "Input Data" tab

### Example

**Message:**
```
Hello, scammer! Return my funds to 0x123...
```

**Encoded (hex calldata):**
```
0x48656c6c6f2c207363616d6d657221205265747572
6e206d792066756e647320746f203078313233...
```

**Etherscan Display:**
- **"Hex" view:** Shows raw hex
- **"UTF-8" view:** Auto-decodes to readable text
- **"Original" tab:** Shows the human-readable message

### Verification

Users can verify callout messages on any block explorer:
1. Find the transaction by hash
2. Go to "Input Data" tab
3. Switch to "UTF-8" view
4. See the original message

### Standards

- **No ABI required** - plain text messages
- **No function selector** - just raw UTF-8 data
- **No prefix** - direct UTF-8 encoding (most compatible)

### Signed Messages

For batch-signed messages (proving ownership):
```
PROOF OF OWNERSHIP

I am the legitimate owner of address 0x...

[Message body]

---
SIGNATURE: 0x...
SIGNED BY: 0x...
```

Etherscan will display this entire block as UTF-8 text, making both the message and signature visible.

## Testing

Test on Etherscan:
1. Send a callout
2. Copy transaction hash
3. View on Etherscan: `https://etherscan.io/tx/[HASH]`
4. Click "Input Data" → Switch to "UTF-8"
5. Verify message is readable

## Alternative Explorers

This encoding also works with:
- Blockscout
- Polygonscan
- Arbiscan
- Basescan
- PulseChain explorer

All support UTF-8 decoding of transaction input data.
