import { recoverMessageAddress, type Address, type Hex } from 'viem'

/**
 * Parsed result from a signed message in the format:
 * MESSAGE: "message content"
 * SIGNATURE: 0x...
 */
export interface ParsedSignedMessage {
  message: string
  signature: Hex
}

/**
 * Parse a decoded message string to extract message and signature.
 * Recognizes the format: MESSAGE: "content"\nSIGNATURE: 0x...
 *
 * @param decodedText - The decoded UTF-8 text that may contain a signed message format
 * @returns ParsedSignedMessage if format is recognized, null otherwise
 */
export function parseSignedMessage(decodedText: string): ParsedSignedMessage | null {
  if (!decodedText || typeof decodedText !== 'string') {
    return null
  }

  // Match the pattern: MESSAGE: "..." followed by SIGNATURE: 0x...
  // The message can contain newlines and quotes (escaped or not)
  // Allow the pattern to appear anywhere in the text (not just at start/end)
  const match = decodedText.match(/MESSAGE:\s*"([\s\S]*?)"\s*\nSIGNATURE:\s*(0x[a-fA-F0-9]+)/)

  if (!match) {
    return null
  }

  const [, messageContent, signatureHex] = match

  // Validate signature format (should be 65 bytes = 130 hex chars + 0x prefix = 132 chars)
  // But also accept shorter signatures (some may be compact)
  if (!signatureHex || !signatureHex.startsWith('0x')) {
    return null
  }

  try {
    return {
      message: messageContent,
      signature: signatureHex as Hex,
    }
  } catch {
    return null
  }
}

/**
 * Recover the address that signed a message from the signature.
 * Uses EIP-191 personal sign format (same as MetaMask/wagmi signMessage).
 *
 * @param parsed - Parsed signed message containing message and signature
 * @returns The recovered address, or null if recovery fails
 */
export async function recoverAddressFromSignedMessage(
  parsed: ParsedSignedMessage
): Promise<Address | null> {
  try {
    const recovered = await recoverMessageAddress({
      message: parsed.message,
      signature: parsed.signature,
    })
    return recovered
  } catch {
    return null
  }
}
