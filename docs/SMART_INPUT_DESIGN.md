# Smart Input Design (Simplified)

## Goal
Make the **Target Address** field smart enough to accept either:
1. A plain address (0x...) → use as target
2. A transaction hash (0x...) → parse it, extract victim/scammer/amounts, auto-fill everything

## User Experience

### Manual Entry (Current Behavior)
```
User enters: 0xScammer123...
→ Target set: 0xScammer123...
```

### Smart Parse (New Behavior)
```
User enters: 0xTxHash456...
→ Detects it's a transaction hash
→ Shows loading: "Analyzing transaction..."
→ Parses: identifies victim, scammer, tokens, amounts
→ Auto-fills:
   - Target: 0xScammer123...
   - Template variables: victim, amount, token, TX hash
→ Shows summary: "✓ Parsed 5 transfers. Victim: 0x..., Scammer: 0x..."
```

## Implementation

### Single Input Field
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Target Address or Transaction Hash                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 0x...                                                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Auto-detected: Transaction hash]                       │
│ [🔍 Parse Transaction]                                  │
└─────────────────────────────────────────────────────────┘
```

### Detection Logic
```typescript
function detectInputType(input: string) {
  if (!input.startsWith('0x') || input.length < 42) return null
  
  // Addresses are 42 chars (0x + 40 hex)
  if (input.length === 42) return 'address'
  
  // TX hashes are 66 chars (0x + 64 hex)
  if (input.length === 66) return 'txhash'
  
  // Try to use as address if 42 chars, otherwise might be TX hash
  return input.length === 42 ? 'address' : 'txhash'
}
```

### Auto-Fill Behavior
When TX hash is detected and parsed:

**1. Set target address**
```typescript
setTargetAddress(parsedTx.scammer)
```

**2. Auto-populate template variables** (if template is selected)
```typescript
if (selectedTemplate) {
  setVariableValues({
    exploited_address: parsedTx.victim,
    scammer: parsedTx.scammer,
    spammer_address: parsedTx.scammer,
    amount: largestTransfer.value,
    token_name: largestTransfer.token.symbol,
    tx_hash: parsedTx.txHash,
    ...existingValues, // Keep user-entered values
  })
}
```

**3. Show what was inferred**
```
┌─────────────────────────────────────────────────────────┐
│ ✓ Transaction Parsed                                     │
│ • Victim: 0x1234... (auto-filled)                       │
│ • Scammer: 0xabcd... (set as target)                    │
│ • Amount: 150,000 PLS (auto-filled)                     │
│ • 5 transfers identified                                 │
└─────────────────────────────────────────────────────────┘
```

## UI Flow

### Step 1: User pastes input
```
Target Address: 0x8a11c88058fc77277436b62178f57f3afee45b1940ffe23fad1aa09a0001c944
                                                                        [↓ Detected: TX hash]
```

### Step 2: Smart detection
```
[🔍 Parse Transaction] button appears
User clicks it (or auto-parse on blur?)
```

### Step 3: Parsing + Auto-fill
```
Loading... "Analyzing transaction"
✓ Parsed
Target updated → 0xScammer...
Template variables auto-filled
```

### Step 4: User reviews/edits
```
All fields visible, pre-filled
User can edit any field
Proceeds to send
```

## Benefits Over Horizontal Layout

✅ **Simpler UX** - one input, smart behavior
✅ **Less screen space** - no multi-step wizard
✅ **Progressive disclosure** - only show parse UI when needed
✅ **Familiar** - still looks like current design
✅ **Flexible** - works for both manual and parsed inputs

## Implementation Checklist

- [x] Transaction parser service (done)
- [x] Detection logic (if length === 66, it's a TX hash)
- [ ] Update target input UI
  - [ ] Add detection label ("Detected: Transaction hash")
  - [ ] Add parse button (conditional)
  - [ ] Add loading state
- [ ] Auto-fill logic (done in handler)
- [ ] Show parsed result summary
- [ ] Handle errors gracefully

## Code Changes Needed

### 1. Target Address Input
```tsx
const inputType = detectInputType(targetAddress)

<Input
  placeholder="Paste address or transaction hash..."
  value={targetAddress}
  onChange={(e) => setTargetAddress(e.target.value)}
/>

{inputType === 'txhash' && (
  <>
    <Text fontSize="xs" color="purple.400">
      🔍 Transaction hash detected
    </Text>
    <Button size="sm" onClick={handleParseTx} isLoading={isParsing}>
      Parse Transaction
    </Button>
  </>
)}

{parsedTx && (
  <Box p={3} bg="rgba(138, 75, 255, 0.06)" borderRadius="lg">
    <Text fontSize="xs" fontWeight="700" color="purple.300">
      ✓ Parsed Successfully
    </Text>
    <Text fontSize="xs" color="whiteAlpha.500">
      Victim: {parsedTx.victim?.slice(0, 10)}... → Scammer: {parsedTx.scammer?.slice(0, 10)}...
    </Text>
  </Box>
)}
```

### 2. Auto-populate on parse
Already implemented in `handleParseTx()` - just needs to be triggered by the button.

## Next Steps

1. Wire up the UI (add detection + parse button to target input)
2. Test with real TX hashes
3. Handle edge cases (no transfers, multiple tokens, etc.)
4. Add Etherscan API key to .env

---

**Status:** Simplified design, ready to implement. No layout changes needed.
