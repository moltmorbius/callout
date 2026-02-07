import { toHex, fromHex, type Hex } from 'viem'

/**
 * Encode a human-readable message as hex calldata for a transaction.
 * The message is UTF-8 encoded then converted to a hex string.
 */
export function encodeMessage(message: string): Hex {
  return toHex(new TextEncoder().encode(message))
}

/**
 * Decode hex calldata back into a human-readable message.
 */
export function decodeMessage(hex: Hex): string {
  const bytes = fromHex(hex, 'bytes')
  return new TextDecoder().decode(bytes)
}

/**
 * Check if a hex string looks like valid UTF-8 text when decoded.
 */
export function isLikelyText(hex: Hex): boolean {
  try {
    const text = decodeMessage(hex)
    // Check if the decoded text contains mostly printable characters
    const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, '')
    return printable.length / text.length > 0.8
  } catch {
    return false
  }
}
