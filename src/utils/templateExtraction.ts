import { type MessageTemplate } from '../config/templates'
import { isAddress } from 'viem'
import { isTxHash } from '../services/blockchain'

/**
 * Extracted data from a decoded template message.
 * Contains structured information parsed from template variables.
 */
export interface ExtractedTemplateData {
  /** Transaction hash of the theft (if found) */
  theftTxHash: string | null
  /** Recovery/return address (if found) */
  receiveAddress: string | null
  /** Exploited/victim address (if found) */
  exploitedAddress: string | null
  /** Scammer/exploiter address (if found) */
  scammerAddress: string | null
  /** Amount mentioned (if found) */
  amount: string | null
  /** Token name/symbol (if found) */
  tokenName: string | null
  /** Chain ID (if found) */
  chainId: string | null
  /** Deadline (if found) */
  deadline: string | null
  /** Project name (if found) */
  projectName: string | null
  /** Contract address (if found) */
  contractAddress: string | null
  /** Recovery percentage mentioned (e.g., "90" for "90%") */
  recoveryPercentage: number | null
}

/**
 * Extract structured data from a decoded message that matches a known template.
 * Uses regex patterns to find template variable values in the message text.
 *
 * @param message - The decoded message text
 * @param template - The identified template
 * @returns Extracted structured data
 */
export function extractTemplateData(
  message: string,
  template: MessageTemplate
): ExtractedTemplateData {
  const extracted: ExtractedTemplateData = {
    theftTxHash: null,
    receiveAddress: null,
    exploitedAddress: null,
    scammerAddress: null,
    amount: null,
    tokenName: null,
    chainId: null,
    deadline: null,
    projectName: null,
    contractAddress: null,
    recoveryPercentage: null,
  }

  // First, try to extract using variable's extract functions (if they have prefixes)
  for (const variable of template.variables) {
    if (variable.extract) {
      const value = variable.extract(message)
      if (value) {
        switch (variable.key) {
          case 'theft_tx_hash':
            if (!extracted.theftTxHash && isTxHash(value)) {
              extracted.theftTxHash = value
            }
            break
          case 'receive_address':
            if (!extracted.receiveAddress && isAddress(value)) {
              extracted.receiveAddress = value
            }
            break
          case 'exploited_address':
            if (!extracted.exploitedAddress && isAddress(value)) {
              extracted.exploitedAddress = value
            }
            break
          case 'spammer_address':
            if (!extracted.scammerAddress && isAddress(value)) {
              extracted.scammerAddress = value
            }
            break
          case 'victim_address':
            if (!extracted.exploitedAddress && isAddress(value)) {
              extracted.exploitedAddress = value
            }
            break
          case 'chain_id':
            if (!extracted.chainId) {
              extracted.chainId = value
            }
            break
          case 'amount':
            if (!extracted.amount) {
              extracted.amount = value
            }
            break
          case 'recovered_amount':
            if (!extracted.amount) {
              extracted.amount = value
            }
            break
          case 'token_name':
            if (!extracted.tokenName) {
              extracted.tokenName = value
            }
            break
          case 'deadline':
            if (!extracted.deadline) {
              extracted.deadline = value
            }
            break
          case 'project_name':
            if (!extracted.projectName) {
              extracted.projectName = value
            }
            break
          case 'contract_address':
            if (!extracted.contractAddress && isAddress(value)) {
              extracted.contractAddress = value
            }
            break
          case 'recovery_address':
            if (!extracted.receiveAddress && isAddress(value)) {
              extracted.receiveAddress = value
            }
            break
          case 'recovery_percentage':
            if (!extracted.recoveryPercentage) {
              const percentage = parseInt(value)
              if (percentage > 0 && percentage <= 100) {
                extracted.recoveryPercentage = percentage
              }
            }
            break
        }
      }
    }
  }

  // Fallback: Extract transaction hash (66 chars: 0x + 64 hex) if not already extracted
  if (!extracted.theftTxHash) {
    const txHashMatch = message.match(/\b(0x[a-fA-F0-9]{64})\b/i)
    if (txHashMatch && isTxHash(txHashMatch[1])) {
      extracted.theftTxHash = txHashMatch[1]
    }
  }

  // Fallback: Extract addresses (42 chars: 0x + 40 hex) if not already extracted via variable functions
  // Only extract addresses that weren't found using template variable prefixes
  const needsAddressExtraction = !extracted.receiveAddress || !extracted.exploitedAddress || 
                                 !extracted.scammerAddress || !extracted.contractAddress
  
  if (needsAddressExtraction) {
    const addressMatches = message.match(/\b(0x[a-fA-F0-9]{40})\b/gi)
    if (addressMatches) {
      const addresses = [...new Set(addressMatches)] // Remove duplicates

      // Try to identify which address is which based on context
      for (const addr of addresses) {
        if (!isAddress(addr)) continue

        // Skip if already extracted
        if (addr.toLowerCase() === extracted.receiveAddress?.toLowerCase() ||
            addr.toLowerCase() === extracted.exploitedAddress?.toLowerCase() ||
            addr.toLowerCase() === extracted.scammerAddress?.toLowerCase() ||
            addr.toLowerCase() === extracted.contractAddress?.toLowerCase()) {
          continue
        }

        // Look for context around the address
        const addrLower = addr.toLowerCase()
        const messageLower = message.toLowerCase()
        const addrIndex = messageLower.indexOf(addrLower)

        if (addrIndex === -1) continue

        // Extract context (50 chars before and after)
        const contextBefore = messageLower.substring(Math.max(0, addrIndex - 50), addrIndex)
        const contextAfter = messageLower.substring(addrIndex + addr.length, Math.min(message.length, addrIndex + addr.length + 50))
        const fullContext = contextBefore + ' ' + contextAfter

        // Identify address types based on context keywords
        if (!extracted.receiveAddress && (
          fullContext.includes('return') ||
          fullContext.includes('receive') ||
          fullContext.includes('to') ||
          fullContext.includes('send to') ||
          fullContext.includes('address to return')
        )) {
          extracted.receiveAddress = addr
          continue
        }

        if (!extracted.exploitedAddress && (
          fullContext.includes('exploited') ||
          fullContext.includes('victim') ||
          fullContext.includes('taken from') ||
          fullContext.includes('stolen from') ||
          fullContext.includes('funds from')
        )) {
          extracted.exploitedAddress = addr
          continue
        }

        if (!extracted.scammerAddress && (
          fullContext.includes('scammer') ||
          fullContext.includes('exploiter') ||
          fullContext.includes('spammer') ||
          fullContext.includes('who controls') ||
          fullContext.includes('malicious')
        )) {
          extracted.scammerAddress = addr
          continue
        }

        if (!extracted.contractAddress && (
          fullContext.includes('contract') ||
          fullContext.includes('deployed') ||
          fullContext.includes('token contract')
        )) {
          extracted.contractAddress = addr
          continue
        }
      }

      // If we couldn't identify specific addresses, assign remaining ones
      // Priority: receive_address > exploited_address > scammer_address
      const identified = new Set([
        extracted.receiveAddress,
        extracted.exploitedAddress,
        extracted.scammerAddress,
        extracted.contractAddress,
      ].filter(Boolean))

      for (const addr of addresses) {
        if (!isAddress(addr) || identified.has(addr)) continue

        if (!extracted.receiveAddress) {
          extracted.receiveAddress = addr
          identified.add(addr)
        } else if (!extracted.exploitedAddress) {
          extracted.exploitedAddress = addr
          identified.add(addr)
        } else if (!extracted.scammerAddress) {
          extracted.scammerAddress = addr
          identified.add(addr)
        }
      }
    }
  }

  // Fallback: Extract chain ID if not already extracted via variable function
  if (!extracted.chainId) {
    const chainIdMatch = message.match(/\bchain\s*(?:id|#)?\s*:?\s*(\d{1,5})\b/i)
    if (chainIdMatch) {
      const chainId = chainIdMatch[1]
      const chainIdNum = parseInt(chainId)
      if (chainIdNum > 0 && chainIdNum < 100000) {
        extracted.chainId = chainId
      }
    }
  }

  // Fallback: Extract amount if not already extracted via variable function
  // Exclude percentages (numbers followed by %) and chain IDs
  if (!extracted.amount) {
    // Match numbers that are NOT followed by % and are not chain IDs
    const amountMatch = message.match(/\b([1-9]\d{0,2}(?:,\d{3})*(?:\.\d+)?|\d{4,})(?:\s|$|[^\d%])(?!\s*%)/i)
    if (amountMatch) {
      // Verify it's not a percentage and not a chain ID
      const matchIndex = message.indexOf(amountMatch[0])
      const beforeMatch = message.substring(Math.max(0, matchIndex - 20), matchIndex).toLowerCase()
      const afterMatch = message.substring(matchIndex + amountMatch[0].length).trim()

      // Don't extract if it's preceded by "chain" (it's a chain ID, not an amount)
      if (!beforeMatch.includes('chain') && !afterMatch.startsWith('%')) {
        const amount = amountMatch[1].replace(/,/g, '')
        // Don't extract "0" as an amount, and don't extract if it matches the chain ID
        if (amount !== '0' && amount !== extracted.chainId) {
          extracted.amount = amount
        }
      }
    }
  }

  // Fallback: Extract token name (common token symbols) if not already extracted
  if (!extracted.tokenName) {
    const tokenMatch = message.match(/\b(ETH|USDC|USDT|DAI|WBTC|PLS|PLSX|HEX|eHEX|pHEX|WBTC|WETH)\b/i)
    if (tokenMatch) {
      extracted.tokenName = tokenMatch[1].toUpperCase()
    }
  }

  // Fallback: Extract deadline if not already extracted via variable function
  if (!extracted.deadline) {
    const deadlineMatch = message.match(/\b(deadline|by|before|until)\s*:?\s*([^.\n]+)/i)
    if (deadlineMatch) {
      extracted.deadline = deadlineMatch[2].trim()
    }
  }

  // Fallback: Extract project name if not already extracted via variable function
  if (!extracted.projectName) {
    const projectMatch = message.match(/\b([A-Z][a-z]+(?:[A-Z][a-z]+)*)\b/)
    if (projectMatch && projectMatch[1].length > 3) {
      // Filter out common words
      const commonWords = ['Return', 'This', 'Notice', 'Message', 'Transaction', 'Address', 'Funds']
      if (!commonWords.includes(projectMatch[1])) {
        extracted.projectName = projectMatch[1]
      }
    }
  }

  // Fallback: Extract recovery percentage if not already extracted via variable function
  if (!extracted.recoveryPercentage) {
    // Look for patterns like "return X%" or "X% of" where X is the recovery percentage
    const percentageMatch = message.match(/\b(?:return|send|give)\s+(\d{1,3})%\b/i)
    if (percentageMatch) {
      const percentage = parseInt(percentageMatch[1])
      if (percentage > 0 && percentage <= 100) {
        extracted.recoveryPercentage = percentage
      }
    } else {
      // Fallback: look for any percentage mentioned near "return" or "recovery"
      const returnContextMatch = message.match(/\b(?:return|recovery|send back).*?(\d{1,3})%\b/i)
      if (returnContextMatch) {
        const percentage = parseInt(returnContextMatch[1])
        if (percentage > 0 && percentage <= 100) {
          extracted.recoveryPercentage = percentage
        }
      }
    }
  }

  return extracted
}
