/**
 * Template data extraction — extracts structured data from decoded messages
 * that match known templates.
 */

import type { MessageTemplate } from './types.js'
import { isTxHash, isAddress } from '../validation/index.js'

/**
 * Extracted data from a decoded template message.
 */
export interface ExtractedTemplateData {
  theftTxHash: string | null
  receiveAddress: string | null
  exploitedAddress: string | null
  scammerAddress: string | null
  amount: string | null
  tokenName: string | null
  chainId: string | null
  deadline: string | null
  projectName: string | null
  contractAddress: string | null
  recoveryPercentage: number | null
}

/**
 * Extract structured data from a decoded message that matches a known template.
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

  // First, try to extract using variable's extract functions
  for (const variable of template.variables) {
    if (variable.extract) {
      const value = variable.extract(message)
      if (value) {
        switch (variable.key) {
          case 'theft_tx_hash':
            if (!extracted.theftTxHash && isTxHash(value)) extracted.theftTxHash = value
            break
          case 'receive_address':
            if (!extracted.receiveAddress && isAddress(value)) extracted.receiveAddress = value
            break
          case 'exploited_address':
            if (!extracted.exploitedAddress && isAddress(value)) extracted.exploitedAddress = value
            break
          case 'spammer_address':
            if (!extracted.scammerAddress && isAddress(value)) extracted.scammerAddress = value
            break
          case 'victim_address':
            if (!extracted.exploitedAddress && isAddress(value)) extracted.exploitedAddress = value
            break
          case 'chain_id':
            if (!extracted.chainId) extracted.chainId = value
            break
          case 'amount':
          case 'recovered_amount':
            if (!extracted.amount) extracted.amount = value
            break
          case 'token_name':
            if (!extracted.tokenName) extracted.tokenName = value
            break
          case 'deadline':
            if (!extracted.deadline) extracted.deadline = value
            break
          case 'project_name':
            if (!extracted.projectName) extracted.projectName = value
            break
          case 'contract_address':
            if (!extracted.contractAddress && isAddress(value)) extracted.contractAddress = value
            break
          case 'recovery_address':
            if (!extracted.receiveAddress && isAddress(value)) extracted.receiveAddress = value
            break
          case 'recovery_percentage':
            if (!extracted.recoveryPercentage) {
              const percentage = parseInt(value)
              if (percentage > 0 && percentage <= 100) extracted.recoveryPercentage = percentage
            }
            break
        }
      }
    }
  }

  // Fallback extractions
  if (!extracted.theftTxHash) {
    const txHashMatch = message.match(/\b(0x[a-fA-F0-9]{64})\b/i)
    if (txHashMatch?.[1] && isTxHash(txHashMatch[1])) extracted.theftTxHash = txHashMatch[1]
  }

  const needsAddressExtraction = !extracted.receiveAddress || !extracted.exploitedAddress ||
    !extracted.scammerAddress || !extracted.contractAddress

  if (needsAddressExtraction) {
    const addressMatches = message.match(/\b(0x[a-fA-F0-9]{40})\b/gi)
    if (addressMatches) {
      const addresses = [...new Set(addressMatches)]

      for (const addr of addresses) {
        if (!isAddress(addr)) continue
        if (
          addr.toLowerCase() === extracted.receiveAddress?.toLowerCase() ||
          addr.toLowerCase() === extracted.exploitedAddress?.toLowerCase() ||
          addr.toLowerCase() === extracted.scammerAddress?.toLowerCase() ||
          addr.toLowerCase() === extracted.contractAddress?.toLowerCase()
        ) continue

        const addrLower = addr.toLowerCase()
        const messageLower = message.toLowerCase()
        const addrIndex = messageLower.indexOf(addrLower)
        if (addrIndex === -1) continue

        const contextBefore = messageLower.substring(Math.max(0, addrIndex - 50), addrIndex)
        const contextAfter = messageLower.substring(addrIndex + addr.length, Math.min(message.length, addrIndex + addr.length + 50))
        const fullContext = contextBefore + ' ' + contextAfter

        if (!extracted.receiveAddress && (
          fullContext.includes('return') || fullContext.includes('receive') ||
          fullContext.includes('to') || fullContext.includes('send to') ||
          fullContext.includes('address to return')
        )) { extracted.receiveAddress = addr; continue }

        if (!extracted.exploitedAddress && (
          fullContext.includes('exploited') || fullContext.includes('victim') ||
          fullContext.includes('taken from') || fullContext.includes('stolen from') ||
          fullContext.includes('funds from')
        )) { extracted.exploitedAddress = addr; continue }

        if (!extracted.scammerAddress && (
          fullContext.includes('scammer') || fullContext.includes('exploiter') ||
          fullContext.includes('spammer') || fullContext.includes('who controls') ||
          fullContext.includes('malicious')
        )) { extracted.scammerAddress = addr; continue }

        if (!extracted.contractAddress && (
          fullContext.includes('contract') || fullContext.includes('deployed') ||
          fullContext.includes('token contract')
        )) { extracted.contractAddress = addr; continue }
      }

      const identified = new Set(
        [extracted.receiveAddress, extracted.exploitedAddress, extracted.scammerAddress, extracted.contractAddress]
          .filter(Boolean)
      )

      for (const addr of addresses) {
        if (!isAddress(addr) || identified.has(addr)) continue
        if (!extracted.receiveAddress) { extracted.receiveAddress = addr; identified.add(addr) }
        else if (!extracted.exploitedAddress) { extracted.exploitedAddress = addr; identified.add(addr) }
        else if (!extracted.scammerAddress) { extracted.scammerAddress = addr; identified.add(addr) }
      }
    }
  }

  if (!extracted.chainId) {
    const chainIdMatch = message.match(/\bchain\s*(?:id|#)?\s*:?\s*(\d{1,5})\b/i)
    if (chainIdMatch?.[1]) {
      const chainIdNum = parseInt(chainIdMatch[1])
      if (chainIdNum > 0 && chainIdNum < 100000) extracted.chainId = chainIdMatch[1]
    }
  }

  if (!extracted.amount) {
    const amountMatch = message.match(/\b([1-9]\d{0,2}(?:,\d{3})*(?:\.\d+)?|\d{4,})(?:\s|$|[^\d%])(?!\s*%)/i)
    if (amountMatch) {
      const matchIndex = message.indexOf(amountMatch[0])
      const beforeMatch = message.substring(Math.max(0, matchIndex - 20), matchIndex).toLowerCase()
      const afterMatch = message.substring(matchIndex + amountMatch[0].length).trim()
      if (!beforeMatch.includes('chain') && !afterMatch.startsWith('%')) {
        const amount = amountMatch[1]!.replace(/,/g, '')
        if (amount !== '0' && amount !== extracted.chainId) extracted.amount = amount
      }
    }
  }

  if (!extracted.tokenName) {
    const tokenMatch = message.match(/\b(ETH|USDC|USDT|DAI|WBTC|PLS|PLSX|HEX|eHEX|pHEX|WETH)\b/i)
    if (tokenMatch?.[1]) extracted.tokenName = tokenMatch[1].toUpperCase()
  }

  if (!extracted.deadline) {
    const deadlineMatch = message.match(/\b(deadline|by|before|until)\s*:?\s*([^.\n]+)/i)
    if (deadlineMatch?.[2]) extracted.deadline = deadlineMatch[2].trim()
  }

  if (!extracted.projectName) {
    const projectMatch = message.match(/\b([A-Z][a-z]+(?:[A-Z][a-z]+)*)\b/)
    if (projectMatch?.[1] && projectMatch[1].length > 3) {
      const commonWords = ['Return', 'This', 'Notice', 'Message', 'Transaction', 'Address', 'Funds']
      if (!commonWords.includes(projectMatch[1])) extracted.projectName = projectMatch[1]
    }
  }

  if (!extracted.recoveryPercentage) {
    const percentageMatch = message.match(/\b(?:return|send|give)\s+(\d{1,3})%\b/i)
    if (percentageMatch?.[1]) {
      const percentage = parseInt(percentageMatch[1])
      if (percentage > 0 && percentage <= 100) extracted.recoveryPercentage = percentage
    } else {
      const returnContextMatch = message.match(/\b(?:return|recovery|send back).*?(\d{1,3})%\b/i)
      if (returnContextMatch?.[1]) {
        const percentage = parseInt(returnContextMatch[1])
        if (percentage > 0 && percentage <= 100) extracted.recoveryPercentage = percentage
      }
    }
  }

  return extracted
}
