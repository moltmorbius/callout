import { messageTemplates, type MessageTemplate } from '../config/templates'

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

  // Extract the actual message content if it's in signed format
  const messageContent = extractMessageContent(decodedMessage)

  // Try to match against each template
  for (const template of messageTemplates) {
    if (matchesTemplate(messageContent, template)) {
      return template
    }
  }

  return null
}

/**
 * Extract the actual message content from a decoded string.
 * Handles both plain messages and signed message format (MESSAGE: "..."\nSIGNATURE: 0x...)
 */
function extractMessageContent(decodedText: string): string {
  // Check if it's in signed format
  const signedMatch = decodedText.match(/MESSAGE:\s*"([\s\S]*?)"\s*\nSIGNATURE:/)
  if (signedMatch) {
    return signedMatch[1]
  }
  return decodedText
}

/**
 * Check if a message matches a template pattern.
 * Uses key phrases and structure to identify templates even when variables are filled.
 */
function matchesTemplate(message: string, template: MessageTemplate): boolean {
  const templateText = template.template.toLowerCase()
  const messageLower = message.toLowerCase()

  // Extract key phrases that are unique to this template (not variables)
  // Remove variable placeholders and conditional blocks to get core text
  const coreTemplate = templateText
    .replace(/\$\{[^}]+\}/g, '') // Remove ${variable} placeholders
    .replace(/\$\{[^}]+\?\s*[^}]+\s*\}/g, '') // Remove conditional blocks
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  // Extract key words/phrases (3+ characters, excluding common words)
  const keyPhrases = extractKeyPhrases(coreTemplate)

  // Count how many key phrases appear in the message
  let matchCount = 0
  for (const phrase of keyPhrases) {
    if (messageLower.includes(phrase)) {
      matchCount++
    }
  }

  // If at least 60% of key phrases match, consider it a match
  const matchThreshold = Math.max(1, Math.ceil(keyPhrases.length * 0.6))

  // Also check for template-specific unique identifiers
  const hasUniqueIdentifiers = checkUniqueIdentifiers(messageLower, template.id)

  return matchCount >= matchThreshold || hasUniqueIdentifiers
}

/**
 * Extract key phrases from template text (words/phrases that help identify it).
 * Filters out common words and focuses on distinctive terms.
 */
function extractKeyPhrases(text: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'will', 'would', 'should', 'could', 'may', 'might', 'can', 'must',
    'from', 'into', 'onto', 'upon', 'about', 'above', 'below', 'between', 'among',
    'return', 'funds', 'address', 'message', 'transaction'
  ])

  // Split into words and filter
  const words = text.split(/\s+/)
    .map(w => w.replace(/[^\w]/g, '').toLowerCase())
    .filter(w => w.length >= 3 && !commonWords.has(w))

  // Also extract 2-3 word phrases
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
 * Check for template-specific unique identifiers that strongly indicate a match.
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

  // Check if at least 2 unique identifiers are present
  const foundCount = templateIdentifiers.filter(id => message.includes(id.toLowerCase())).length
  return foundCount >= 2
}
