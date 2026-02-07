/**
 * Template recognition — identifies which template a decoded message matches.
 */

import type { MessageTemplate } from './types.js'
import { messageTemplates } from './data.js'

/**
 * Attempts to identify which template a decoded message matches.
 * Uses pattern matching against template structures to recognize interpolated templates.
 *
 * @param decodedMessage - The decoded UTF-8 message text
 * @returns The matched template, or null if no match found
 */
export function identifyTemplate(decodedMessage: string): MessageTemplate | null {
  if (!decodedMessage || typeof decodedMessage !== 'string') {
    return null
  }

  const messageContent = extractMessageContent(decodedMessage)

  for (const template of messageTemplates) {
    if (matchesTemplate(messageContent, template)) {
      return template
    }
  }

  return null
}

/**
 * Extract the actual message content from a decoded string.
 * Handles both plain messages and signed message format.
 */
function extractMessageContent(decodedText: string): string {
  const signedMatch = decodedText.match(/MESSAGE:\s*"([\s\S]*?)"\s*\nSIGNATURE:/)
  if (signedMatch) {
    return signedMatch[1]!
  }
  return decodedText
}

/**
 * Check if a message matches a template pattern.
 */
function matchesTemplate(message: string, template: MessageTemplate): boolean {
  const templateText = template.template.toLowerCase()
  const messageLower = message.toLowerCase()

  const coreTemplate = templateText
    .replace(/\$\{[^}]+\}/g, '')
    .replace(/\$\{[^}]+\?\s*[^}]+\s*\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const keyPhrases = extractKeyPhrases(coreTemplate)

  let matchCount = 0
  for (const phrase of keyPhrases) {
    if (messageLower.includes(phrase)) {
      matchCount++
    }
  }

  const matchThreshold = Math.max(1, Math.ceil(keyPhrases.length * 0.6))
  const hasUniqueIdentifiers = checkUniqueIdentifiers(messageLower, template.id)

  return matchCount >= matchThreshold || hasUniqueIdentifiers
}

/**
 * Extract key phrases from template text.
 */
function extractKeyPhrases(text: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'will', 'would', 'should', 'could', 'may', 'might', 'can', 'must',
    'from', 'into', 'onto', 'upon', 'about', 'above', 'below', 'between', 'among',
    'return', 'funds', 'address', 'message', 'transaction'
  ])

  const words = text.split(/\s+/)
    .map(w => w.replace(/[^\w]/g, '').toLowerCase())
    .filter(w => w.length >= 3 && !commonWords.has(w))

  const phrases: string[] = []
  for (let i = 0; i < words.length - 1; i++) {
    const twoWord = `${words[i]} ${words[i + 1]}`
    if (twoWord.length >= 6) {
      phrases.push(twoWord)
    }
    if (i < words.length - 2) {
      const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
      if (threeWord.length >= 9) {
        phrases.push(threeWord)
      }
    }
  }

  return [...new Set([...words, ...phrases])]
}

/**
 * Check for template-specific unique identifiers.
 */
function checkUniqueIdentifiers(message: string, templateId: string): boolean {
  const identifiers: Record<string, string[]> = {
    'scam-bounty-simple': ['return 90%', 'keep 10%', 'legitimate bounty', 'good-faith offer'],
    'scam-bounty': ['return 90%', 'keep 10%', 'legitimate bounty', 'good-faith offer'],
    'scam-legal': ['legal action', 'law enforcement', 'attorney', 'litigation'],
    'scam-deadline': ['final warning', 'last opportunity', 'without escalation', 'collected evidence'],
    'rug-accountability': ['deployed and controlled', 'removed without community consent', 'immutable on-chain record'],
    'rug-community': ['public notice', 'identified as a rug pull', 'drained approximately', 'permanent and searchable'],
    'approval-revoke': ['revoke your approval', 'revoke.cash', 'approval manager', 'exploiting token approvals'],
    'approval-demand': ['exploited token approvals', 'exploit transactions', 'exchanges have been notified'],
    'warning-identity': ['public record', 'associated with', 'identified in connection', 'permanent warning'],
    'warning-exchange': ['exchange & bridge notice', 'proceeds of theft', 'should be frozen', 'legitimate owner recovery'],
  }

  const templateIdentifiers = identifiers[templateId]
  if (!templateIdentifiers) return false

  const foundCount = templateIdentifiers.filter(id => message.includes(id.toLowerCase())).length
  return foundCount >= 2
}
