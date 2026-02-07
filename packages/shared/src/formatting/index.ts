/**
 * Shared formatting utilities for addresses, timestamps, and token amounts.
 */

/* ── Time constants (seconds) ─────────────────────────────── */

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3_600
const SECONDS_PER_DAY = 86_400
const SECONDS_PER_WEEK = 604_800

/* ── Address formatting ───────────────────────────────────── */

/**
 * Truncates an Ethereum address for display.
 *
 * @param addr - The address to truncate
 * @param prefixChars - Number of leading characters to keep (default: 6, includes "0x")
 * @param suffixChars - Number of trailing characters to keep (default: 4)
 * @returns Truncated address string (e.g., "0x1234…5678")
 */
export function truncateAddress(
  addr: string,
  prefixChars: number = 6,
  suffixChars: number = 4,
): string {
  if (addr.length <= prefixChars + suffixChars) return addr
  return `${addr.slice(0, prefixChars)}…${addr.slice(-suffixChars)}`
}

/* ── Time formatting ──────────────────────────────────────── */

/**
 * Formats a Unix timestamp as a human-readable "time ago" string.
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted string (e.g., "5m ago", "2h ago", "3d ago", or date)
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < SECONDS_PER_MINUTE) return 'just now'
  if (diff < SECONDS_PER_HOUR) {
    const mins = Math.floor(diff / SECONDS_PER_MINUTE)
    return `${mins}m ago`
  }
  if (diff < SECONDS_PER_DAY) {
    const hours = Math.floor(diff / SECONDS_PER_HOUR)
    return `${hours}h ago`
  }
  if (diff < SECONDS_PER_WEEK) {
    const days = Math.floor(diff / SECONDS_PER_DAY)
    return `${days}d ago`
  }

  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

/* ── Message formatting ───────────────────────────────────── */

/**
 * Truncates a message string to a maximum length, adding ellipsis if needed.
 * @param message - The message to truncate
 * @param maxLength - Maximum length before truncation (default: 200)
 * @returns Truncated message string
 */
export function truncateMessage(message: string, maxLength: number = 200): string {
  if (message.length <= maxLength) return message
  return message.slice(0, maxLength).trimEnd() + '…'
}

/* ── Token amount formatting ──────────────────────────────── */

/**
 * Format a raw integer amount with the given number of decimals.
 * E.g. formatUnits("1500000000000000000", 18) → "1.5"
 */
function formatUnits(value: string, decimals: number): string {
  const raw = BigInt(value)
  const divisor = BigInt(10 ** decimals)
  const wholePart = raw / divisor
  const fractionalPart = raw % divisor
  if (fractionalPart === 0n) return wholePart.toString()
  const fractionalStr = fractionalPart
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')
  return `${wholePart}.${fractionalStr}`
}

/**
 * Formats a token amount for display.
 * Handles native ETH (wei → ether), ERC20, and non-fungible token standards.
 *
 * @param value - The token amount as a string (wei or token units)
 * @param decimals - Number of decimals for the token (default: 18 for native)
 * @param type - Type of transfer ('native', 'erc20', 'erc721', 'erc1155', 'erc1155-batch')
 * @returns Formatted amount string
 */
export function formatTokenAmount(
  value: string,
  decimals?: number,
  type?: string,
): string {
  // Non-fungible tokens: value is a token ID or batch indicator, not an amount
  if (type === 'erc721' || type === 'erc1155' || type === 'erc1155-batch') {
    return value
  }

  // Fungible: native or erc20
  const dec = decimals ?? (type === 'native' ? 18 : 0)
  if (dec > 0) return formatUnits(value, dec)

  return value
}
