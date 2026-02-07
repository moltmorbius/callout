# Callout Codebase

**Put scammers on blast. On-chain. Forever.**

Callout is a fully client-side decentralized messaging application that enables users to send on-chain messages (callouts) to Ethereum addresses. Messages are encoded as UTF-8 hex in transaction calldata and sent as zero-value transactions, creating permanent, immutable records on the blockchain.

**Stack:** React 19, TypeScript, Vite, Chakra UI, viem/wagmi, Reown AppKit, ECIES encryption

**Structure:** Feature-based component organization with clear separation between UI, logic (utils/services), and configuration layers. Fully client-side with optional Express API backend for transaction parsing.

For detailed architecture, see [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).

---

## Critical Coding Standards

### React Hooks Pattern: Top-Level Only

**CRITICAL RULE**: React hooks (including `useColorModeValue`, `useAccent*`, `useTheme*`, etc.) **MUST NEVER** be called directly in JSX props or conditionals.

#### The Rule

1. **NEVER** put hooks directly in JSX props
2. **ALWAYS** call hooks at the top level of the component
3. **ALWAYS** assign hook results to variables
4. **ALWAYS** use those variables in JSX

#### Examples

**❌ BAD - Hook in JSX prop:**
```tsx
<Text
  bgGradient={useColorModeValue(
    getThemeValue(gradients.headerLogo, 'light'),
    getThemeValue(gradients.headerLogo, 'dark')
  )}
>
  Callout
</Text>
```

**✅ GOOD - Hook at top level, variable in JSX:**
```tsx
function Header() {
  const headerLogoGradient = useColorModeValue(
    getThemeValue(gradients.headerLogo, 'light'),
    getThemeValue(gradients.headerLogo, 'dark')
  )

  return (
    <Text bgGradient={headerLogoGradient}>
      Callout
    </Text>
  )
}
```

**Why This Matters:**
- React hooks must be called in the same order on every render
- Hooks in JSX props violate the Rules of Hooks
- Conditionals in JSX can cause hooks to be called conditionally
- This pattern will cause runtime errors and break React's hook system

**Pattern to Follow:**
```tsx
function Component() {
  // 1. All hooks at the top level
  const color1 = useColorModeValue(...)
  const color2 = useThemeBgColor(...)
  const color3 = useAccentTextColor(...)

  // 2. Other logic
  const computedValue = useMemo(...)

  // 3. Return JSX using variables
  return <Box bg={color1} color={color2} />
}
```
