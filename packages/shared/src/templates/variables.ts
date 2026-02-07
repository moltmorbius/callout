/**
 * Reusable template variable factory functions.
 * Each creates a TemplateVariable with an optional prefix-based extraction function.
 */

import type { TemplateVariable } from './types.js'

/** Helper to create an extractor that finds a value after a known prefix. */
function prefixAddressExtractor(prefix: string) {
  return (message: string) => {
    const messageLower = message.toLowerCase()
    const prefixLower = prefix.toLowerCase()
    const prefixIndex = messageLower.indexOf(prefixLower)
    if (prefixIndex === -1) return null
    const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
    const addressMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{40})\b/i)
    return addressMatch?.[1] ?? null
  }
}

export function VAR_RECEIVE_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'receive_address',
    label: 'Return Address',
    placeholder: '0x... address to return funds to',
    type: 'address',
    prefix,
    extract: prefix ? prefixAddressExtractor(prefix) : undefined,
  }
}

export function VAR_EXPLOITED_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'exploited_address',
    label: 'Exploited Address',
    placeholder: '0x... address that was exploited',
    type: 'address',
    prefix,
    extract: prefix ? prefixAddressExtractor(prefix) : undefined,
  }
}

export function VAR_SPAMMER_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'spammer_address',
    label: 'Scammer Address',
    placeholder: '0x... scammer / exploiter address',
    type: 'address',
    prefix,
    extract: prefix ? prefixAddressExtractor(prefix) : undefined,
  }
}

export function VAR_VICTIM_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'victim_address',
    label: 'Victim Address',
    placeholder: '0x... address that lost funds',
    type: 'address',
    prefix,
    extract: prefix ? prefixAddressExtractor(prefix) : undefined,
  }
}

export function VAR_RECOVERY_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'recovery_address',
    label: 'Recovery Address',
    placeholder: '0x... address holding recovered funds',
    type: 'address',
    prefix,
    extract: prefix ? prefixAddressExtractor(prefix) : undefined,
  }
}

export function VAR_CONTRACT_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'contract_address',
    label: 'Contract Address',
    placeholder: '0x... malicious contract address',
    type: 'address',
    prefix,
    extract: prefix ? prefixAddressExtractor(prefix) : undefined,
  }
}

export function VAR_DEADLINE(prefix?: string): TemplateVariable {
  return {
    key: 'deadline',
    label: 'Deadline',
    placeholder: 'e.g. 48 hours, July 30 2025',
    type: 'text',
    optional: true,
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null
      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const deadlineMatch = afterPrefix.match(/^([^.\n]+?)(?:\s+to\s+|\s+and\s+|$)/i)
      return deadlineMatch?.[1] ? deadlineMatch[1].trim() : null
    } : undefined,
  }
}

export function VAR_TOKEN_NAME(prefix?: string): TemplateVariable {
  return {
    key: 'token_name',
    label: 'Token Name',
    placeholder: 'e.g. ETH, USDC, PLS',
    type: 'text',
    optional: true,
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null
      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const tokenMatch = afterPrefix.match(/^([A-Z]{2,10}|ETH|USDC|USDT|DAI|WBTC|PLS|PLSX|HEX|eHEX|pHEX|WETH)\b/i)
      return tokenMatch?.[1] ? tokenMatch[1].toUpperCase() : null
    } : undefined,
  }
}

export function VAR_AMOUNT(prefix?: string): TemplateVariable {
  return {
    key: 'amount',
    label: 'Amount',
    placeholder: 'e.g. 150,000',
    type: 'text',
    optional: true,
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null
      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const amountMatch = afterPrefix.match(/^(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d{4,})(?!\s*%)/i)
      if (amountMatch?.[1]) {
        const amount = amountMatch[1].replace(/,/g, '')
        if (amount !== '0') return amount
      }
      return null
    } : undefined,
  }
}

export function VAR_RECOVERED_AMOUNT(prefix?: string): TemplateVariable {
  return {
    key: 'recovered_amount',
    label: 'Recovered Amount',
    placeholder: 'e.g. 150,000',
    type: 'text',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null
      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const amountMatch = afterPrefix.match(/^(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d{4,})(?!\s*%)/i)
      const amountStr = amountMatch?.[1]
      if (amountStr) {
        const amount = amountStr.replace(/,/g, '')
        if (amount !== '0') return amount
      }
      return null
    } : undefined,
  }
}

export function VAR_PROJECT_NAME(prefix?: string): TemplateVariable {
  return {
    key: 'project_name',
    label: 'Project Name',
    placeholder: 'e.g. RocketSwap, SafeYield',
    type: 'text',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null
      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const projectMatch = afterPrefix.match(/^([A-Z][a-z]+(?:[A-Z][a-z]+)*)/)
      if (projectMatch?.[1] && projectMatch[1].length > 3) {
        const commonWords = ['Return', 'This', 'Notice', 'Message', 'Transaction', 'Address', 'Funds']
        if (!commonWords.includes(projectMatch[1])) return projectMatch[1]
      }
      return null
    } : undefined,
  }
}

export function VAR_THEFT_TX_HASH(prefix?: string): TemplateVariable {
  return {
    key: 'theft_tx_hash',
    label: 'Theft Transaction Hash',
    placeholder: '0x... transaction hash of the theft',
    type: 'text',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null
      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const txHashMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{64})\b/i)
      return txHashMatch?.[1] ?? null
    } : undefined,
  }
}

export function VAR_CHAIN_ID(prefix?: string): TemplateVariable {
  return {
    key: 'chain_id',
    label: 'Chain ID',
    placeholder: 'e.g. 369, 1, 137, 8453',
    type: 'number',
    prefix,
    extract: prefix ? (message: string) => {
      const prefixLower = prefix.toLowerCase()
      const escapedPrefix = prefixLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const searchPattern = new RegExp(escapedPrefix + '\\s+(\\d{1,5})(?!\\s*%)', 'i')
      const match = message.match(searchPattern)
      if (match?.[1]) {
        const chainIdNum = parseInt(match[1])
        if (chainIdNum > 0 && chainIdNum < 100000) {
          const matchIndex = match.index!
          const afterMatch = message.substring(matchIndex + match[0].length).trim()
          if (!afterMatch.startsWith('%')) return match[1]
        }
      }
      return null
    } : undefined,
  }
}

export function VAR_RECOVERY_PERCENTAGE(prefix?: string): TemplateVariable {
  return {
    key: 'recovery_percentage',
    label: 'Recovery Percentage',
    placeholder: '90 (for 90%)',
    type: 'number',
    prefix,
    extract: prefix ? (message: string) => {
      const prefixLower = prefix.toLowerCase()
      const escapedPrefix = prefixLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const searchPattern = new RegExp(escapedPrefix + '\\s*(\\d{1,3})%', 'i')
      const match = message.match(searchPattern)
      if (match?.[1]) {
        const percentage = parseInt(match[1])
        if (percentage > 0 && percentage <= 100) return String(percentage)
      }
      return null
    } : undefined,
  }
}
