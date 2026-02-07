/**
 * UTF-8 ↔ hex encoding for on-chain calldata.
 *
 * Messages are encoded as UTF-8 bytes then converted to hex strings
 * for use as transaction calldata.
 */

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
 * Returns true if > 80% of decoded characters are printable ASCII.
 */
export function isLikelyText(hex: Hex): boolean {
  try {
    const text = decodeMessage(hex)
    const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, '')
    return printable.length / text.length > 0.8
  } catch {
    return false
  }
}
