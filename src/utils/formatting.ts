/**
 * Shared formatting utilities for addresses, timestamps, and token amounts.
 */

/**
 * Truncates an Ethereum address to show first 6 and last 4 characters.
 * @param addr - The address to truncate
 * @returns Truncated address string (e.g., "0x1234…5678")
 */
export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/**
 * Formats a Unix timestamp as a human-readable "time ago" string.
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted string (e.g., "5m ago", "2h ago", "3d ago", or date)
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'just now'
  if (diff < 3600) {
    const mins = Math.floor(diff / 60)
    return `${mins}m ago`
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours}h ago`
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400)
    return `${days}d ago`
  }

  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

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

import { formatEther, formatUnits } from 'viem'

/**
 * Formats a token amount based on its type and decimals.
 * @param value - The token amount as a string (wei or token units)
 * @param decimals - Number of decimals for the token
 * @param type - Type of transfer ('native', 'erc20', 'erc721', 'erc1155', 'erc1155-batch')
 * @returns Formatted amount string
 */
export function formatTokenAmount(
  value: string,
  decimals?: number,
  type?: string
): string {
  if (type === 'native') {
    return formatEther(BigInt(value))
  }
  if (type === 'erc721' || type === 'erc1155' || type === 'erc1155-batch') {
    return value // Token ID or batch indicator, not an amount
  }
  if (decimals !== undefined) {
    return formatUnits(BigInt(value), decimals)
  }
  return value
}
