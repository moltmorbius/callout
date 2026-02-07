// ─── Template System ────────────────────────────────────────────────
// Category-based message templates with variable placeholders.
// Variables use ${var_name} syntax and are filled via form fields.

/** Legacy tone type — kept for the custom free-form option */
export type MessageTone = 'custom'

// ── Variable definitions ────────────────────────────────────────────

export type VariableType = 'address' | 'text' | 'number' | 'date'

export interface TemplateVariable {
  /** Key used in template string, e.g. "receive_address" → ${receive_address} */
  key: string
  /** Human-readable label for the form field */
  label: string
  /** Placeholder hint inside the input */
  placeholder: string
  /** Controls input type / validation */
  type: VariableType
  /** If true, this field is optional and can be left blank */
  optional?: boolean
  /** Prefix text that appears before this variable in the template (used for extraction) */
  prefix?: string
  /** Function to extract this variable's value from a message using the prefix */
  extract?: (message: string) => string | null
}

// ── Template & category types ───────────────────────────────────────

export type TemplateCategoryId =
  | 'scam-recovery'
  | 'rug-pull'
  | 'approval-exploit'
  | 'public-warning'
  | 'whitehat-recovery'

export interface TemplateCategory {
  id: TemplateCategoryId
  name: string
  emoji: string
  color: string
  description: string
  /** Label describing who the sender (connected wallet / app user) represents in
   *  this category's context (e.g., "victim", "community member", "whitehat").
   *  Used for contextual UI labels. */
  senderLabel: string
  /** Label describing who the target address represents in this category's context
   *  (e.g., "scammer", "developer", "victim"). Used for contextual UI labels like
   *  "Use scammer's address" in the encryption section. */
  targetLabel: string
}

export interface MessageTemplate {
  id: string
  name: string
  categoryId: TemplateCategoryId
  emoji: string
  /** The message body with ${variable} placeholders */
  template: string
  description: string
  /** Which variables this template needs filled */
  variables: TemplateVariable[]
}

// ── Categories ──────────────────────────────────────────────────────

export const templateCategories: TemplateCategory[] = [
  {
    id: 'scam-recovery',
    name: 'Scam Recovery',
    emoji: '🛡️',
    color: 'green',
    description: 'Negotiate return of stolen funds',
    senderLabel: 'victim',
    targetLabel: 'scammer',
  },
  {
    id: 'rug-pull',
    name: 'Rug Pull',
    emoji: '🪤',
    color: 'yellow',
    description: 'Hold devs accountable on-chain',
    senderLabel: 'investor',
    targetLabel: 'developer',
  },
  {
    id: 'approval-exploit',
    name: 'Approval Exploit',
    emoji: '🔓',
    color: 'red',
    description: 'Warn about token approval abuse',
    senderLabel: 'victim',
    targetLabel: 'exploiter',
  },
  {
    id: 'public-warning',
    name: 'Public Warning',
    emoji: '📢',
    color: 'orange',
    description: 'Broadcast warnings to the ecosystem',
    senderLabel: 'reporter',
    targetLabel: 'recipient',
  },
  {
    id: 'whitehat-recovery',
    name: 'Whitehat Recovery',
    emoji: '🤝',
    color: 'blue',
    description: 'Reach out to victims after recovering funds',
    senderLabel: 'whitehat',
    targetLabel: 'victim',
  },
]

// ── Reusable variable definitions ───────────────────────────────────

/**
 * Creates a receive_address variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable in the template (e.g., "to ", "return to ")
 */
function VAR_RECEIVE_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'receive_address',
    label: 'Return Address',
    placeholder: '0x... address to return funds to',
    type: 'address',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null

      // Look for address after the prefix
      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const addressMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{40})\b/i)
      return addressMatch?.[1] ?? null
    } : undefined,
  }
}

/**
 * Creates an exploited_address variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "from ", "taken from ")
 */
function VAR_EXPLOITED_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'exploited_address',
    label: 'Exploited Address',
    placeholder: '0x... address that was exploited',
    type: 'address',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null

      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const addressMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{40})\b/i)
      return addressMatch?.[1] ?? null
    } : undefined,
  }
}

/**
 * Creates a spammer_address variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "scammer ", "from ")
 */
function VAR_SPAMMER_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'spammer_address',
    label: 'Scammer Address',
    placeholder: '0x... scammer / exploiter address',
    type: 'address',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null

      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const addressMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{40})\b/i)
      return addressMatch?.[1] ?? null
    } : undefined,
  }
}

/**
 * Creates a deadline variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "by ", "before ")
 */
function VAR_DEADLINE(prefix?: string): TemplateVariable {
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
      // Extract deadline text until period, newline, or end
      const deadlineMatch = afterPrefix.match(/^([^.\n]+?)(?:\s+to\s+|\s+and\s+|$)/i)
      return deadlineMatch?.[1] ? deadlineMatch[1].trim() : null
    } : undefined,
  }
}

/**
 * Creates a token_name variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "token ", "amount of ")
 */
function VAR_TOKEN_NAME(prefix?: string): TemplateVariable {
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
      // Look for token symbol (2-10 uppercase letters or common tokens)
      const tokenMatch = afterPrefix.match(/^([A-Z]{2,10}|ETH|USDC|USDT|DAI|WBTC|PLS|PLSX|HEX|eHEX|pHEX|WETH)\b/i)
      return tokenMatch?.[1] ? tokenMatch[1].toUpperCase() : null
    } : undefined,
  }
}

/**
 * Creates an amount variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "approximately ", "amount of ")
 */
function VAR_AMOUNT(prefix?: string): TemplateVariable {
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
      // Match numbers with optional commas and decimals, but not percentages
      const amountMatch = afterPrefix.match(/^(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d{4,})(?!\s*%)/i)
      if (amountMatch?.[1]) {
        const amount = amountMatch[1].replace(/,/g, '')
        // Don't extract "0" as an amount
        if (amount !== '0') {
          return amount
        }
      }
      return null
    } : undefined,
  }
}

/**
 * Creates a project_name variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "project ", "the project ")
 */
function VAR_PROJECT_NAME(prefix?: string): TemplateVariable {
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
      // Extract capitalized project name (one or more capitalized words)
      const projectMatch = afterPrefix.match(/^([A-Z][a-z]+(?:[A-Z][a-z]+)*)/)
      if (projectMatch?.[1] && projectMatch[1].length > 3) {
        const commonWords = ['Return', 'This', 'Notice', 'Message', 'Transaction', 'Address', 'Funds']
        if (!commonWords.includes(projectMatch[1])) {
          return projectMatch[1]
        }
      }
      return null
    } : undefined,
  }
}

/**
 * Creates a contract_address variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "contract at ", "via contract ")
 */
function VAR_CONTRACT_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'contract_address',
    label: 'Contract Address',
    placeholder: '0x... malicious contract address',
    type: 'address',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null

      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const addressMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{40})\b/i)
      return addressMatch?.[1] ?? null
    } : undefined,
  }
}

/**
 * Creates a theft_tx_hash variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "transaction hash ", "tx hash ")
 */
function VAR_THEFT_TX_HASH(prefix?: string): TemplateVariable {
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
      // Match transaction hash (0x + 64 hex chars)
      const txHashMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{64})\b/i)
      return txHashMatch?.[1] ?? null
    } : undefined,
  }
}

/**
 * Creates a chain_id variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "on chain ", "chain ")
 */
function VAR_CHAIN_ID(prefix?: string): TemplateVariable {
  return {
    key: 'chain_id',
    label: 'Chain ID',
    placeholder: 'e.g. 369, 1, 137, 8453',
    type: 'number',
    prefix,
    extract: prefix ? (message: string) => {
      const prefixLower = prefix.toLowerCase()
      const escapedPrefix = prefixLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match prefix followed by optional whitespace and digits (but not percentages)
      const searchPattern = new RegExp(escapedPrefix + '\\s+(\\d{1,5})(?!\\s*%)', 'i')
      const match = message.match(searchPattern)

      if (match && match[1]) {
        const chainId = match[1]
        const chainIdNum = parseInt(chainId)
        // Validate it's a reasonable chain ID
        if (chainIdNum > 0 && chainIdNum < 100000) {
          // Double-check: make sure it's not followed by %
          const matchIndex = match.index!
          const afterMatch = message.substring(matchIndex + match[0].length).trim()
          if (!afterMatch.startsWith('%')) {
            return chainId
          }
        }
      }
      return null
    } : undefined,
  }
}

/**
 * Creates a recovery_percentage variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "return ", "recovery percentage ")
 */
function VAR_RECOVERY_PERCENTAGE(prefix?: string): TemplateVariable {
  return {
    key: 'recovery_percentage',
    label: 'Recovery Percentage',
    placeholder: '90 (for 90%)',
    type: 'number',
    prefix,
    extract: prefix ? (message: string) => {
      const prefixLower = prefix.toLowerCase()
      const escapedPrefix = prefixLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match prefix followed by optional whitespace, digits, and %
      const searchPattern = new RegExp(escapedPrefix + '\\s*(\\d{1,3})%', 'i')
      const match = message.match(searchPattern)

      if (match && match[1]) {
        const percentage = parseInt(match[1])
        if (percentage > 0 && percentage <= 100) {
          return String(percentage)
        }
      }
      return null
    } : undefined,
  }
}

/**
 * Creates a victim_address variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "from ", "victim address ")
 */
function VAR_VICTIM_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'victim_address',
    label: 'Victim Address',
    placeholder: '0x... address that lost funds',
    type: 'address',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null

      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const addressMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{40})\b/i)
      return addressMatch?.[1] ?? null
    } : undefined,
  }
}

/**
 * Creates a recovery_address variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "at ", "held at ")
 */
function VAR_RECOVERY_ADDRESS(prefix?: string): TemplateVariable {
  return {
    key: 'recovery_address',
    label: 'Recovery Address',
    placeholder: '0x... address holding recovered funds',
    type: 'address',
    prefix,
    extract: prefix ? (message: string) => {
      const messageLower = message.toLowerCase()
      const prefixLower = prefix.toLowerCase()
      const prefixIndex = messageLower.indexOf(prefixLower)
      if (prefixIndex === -1) return null

      const afterPrefix = message.substring(prefixIndex + prefix.length).trim()
      const addressMatch = afterPrefix.match(/^(0x[a-fA-F0-9]{40})\b/i)
      return addressMatch?.[1] ?? null
    } : undefined,
  }
}

/**
 * Creates a recovered_amount variable with optional prefix for extraction.
 * @param prefix - Text that appears before this variable (e.g., "recovered ", "amount of ")
 */
function VAR_RECOVERED_AMOUNT(prefix?: string): TemplateVariable {
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
        if (amount !== '0') {
          return amount
        }
      }
      return null
    } : undefined,
  }
}

// ── Templates ───────────────────────────────────────────────────────

export const messageTemplates: MessageTemplate[] = [
  // ── Scam Recovery ─────────────────────────────────────────────────
  {
    id: 'scam-bounty-whitehat',
    name: 'Bounty Offer (Whitehat)',
    categoryId: 'scam-recovery',
    emoji: '🤝',
    template:
      'This is a message regarding funds taken from ${exploited_address}. ' +
      'If you are a whitehat security researcher who recovered these funds, please return ${recovery_percentage}%${amount? of the ${amount}}${token_name? ${token_name}} to ${receive_address} and keep ${bounty_percentage}% as a legitimate bounty.${deadline? Please respond by ${deadline}.} This is a good-faith offer.',
    description: 'Bounty offer assuming whitehat intent - collaborative tone',
    variables: [
      VAR_EXPLOITED_ADDRESS('taken from '),
      VAR_RECOVERY_PERCENTAGE('return '),
      VAR_AMOUNT('the '),
      VAR_TOKEN_NAME(),
      VAR_RECEIVE_ADDRESS('to '),
      VAR_DEADLINE('respond by '),
    ],
  },
  {
    id: 'scam-bounty-simple',
    name: 'Bounty Offer (Simple)',
    categoryId: 'scam-recovery',
    emoji: '💰',
    template:
      'Return ${recovery_percentage}% of the funds procured in transaction hash ${theft_tx_hash} on chain ${chain_id} to ${receive_address} and keep ${bounty_percentage}% as a legitimate bounty. This is a good-faith offer.',
    description: 'Simple bounty offer - clean and direct',
    variables: [
      VAR_RECOVERY_PERCENTAGE('Return '),
      VAR_THEFT_TX_HASH('transaction hash '),
      VAR_CHAIN_ID('on chain '),
      VAR_RECEIVE_ADDRESS('to '),
    ],
  },
  {
    id: 'scam-bounty',
    name: 'Bounty Offer (Detailed)',
    categoryId: 'scam-recovery',
    emoji: '💰',
    template:
      'This is a message regarding funds taken from ${exploited_address}. ' +
      'Return ${recovery_percentage}%${amount? of the ${amount}}${token_name? ${token_name}} to ${receive_address} and keep ${bounty_percentage}% as a legitimate bounty.${deadline? No further action will be pursued if funds are returned by ${deadline}.} This is a good-faith offer.',
    description: 'Detailed bounty offer with specific amounts',
    variables: [
      VAR_EXPLOITED_ADDRESS('taken from '),
      VAR_RECOVERY_PERCENTAGE('Return '),
      VAR_AMOUNT('the '),
      VAR_TOKEN_NAME(),
      VAR_RECEIVE_ADDRESS('to '),
      VAR_DEADLINE('returned by '),
    ],
  },
  {
    id: 'scam-legal',
    name: 'Legal Threat (Scammer)',
    categoryId: 'scam-recovery',
    emoji: '⚖️',
    template:
      'NOTICE: Unauthorized transfers from ${exploited_address} have been documented. ' +
      'Blockchain forensics and law enforcement have been engaged. ' +
      'Return funds${amount? ${amount}}${token_name? ${token_name}} to ${receive_address} immediately. ' +
      'Failure to comply will result in legal proceedings. All on-chain evidence is preserved permanently.',
    description: 'Formal legal notice with law enforcement mention - for scammers',
    variables: [
      VAR_EXPLOITED_ADDRESS('from '),
      VAR_AMOUNT('('),
      VAR_TOKEN_NAME(),
      VAR_RECEIVE_ADDRESS('to '),
    ],
  },
  {
    id: 'scam-deadline',
    name: 'Deadline Warning (Scammer)',
    categoryId: 'scam-recovery',
    emoji: '⏰',
    template:
      'FINAL WARNING: Return funds${amount? ${amount}}${token_name? ${token_name}} to ${receive_address}${deadline? by ${deadline}}. ' +
      'All collected evidence including transaction traces, wallet clustering data, and exchange deposit records ' +
      'will be submitted to relevant authorities and published publicly. ' +
      'This is your last opportunity to resolve this without escalation.',
    description: 'Final deadline with specific consequences - for scammers',
    variables: [
      VAR_AMOUNT('('),
      VAR_TOKEN_NAME(),
      VAR_RECEIVE_ADDRESS('to '),
      VAR_DEADLINE('by '),
    ],
  },

  // ── Rug Pull ──────────────────────────────────────────────────────
  {
    id: 'rug-accountability',
    name: 'Developer Accountability',
    categoryId: 'rug-pull',
    emoji: '👤',
    template:
      'This address deployed and controlled ${project_name}. ' +
      'Liquidity${amount? approximately ${amount}}${token_name? ${token_name}} was removed without community consent. ' +
      'This message is an immutable, on-chain record of that action. ' +
      'Investors and future projects can verify this wallet\'s history permanently. ' +
      'Return funds to ${receive_address} to begin making this right.',
    description: 'On-chain record tying a dev wallet to a rug pull',
    variables: [
      VAR_PROJECT_NAME('controlled '),
      VAR_AMOUNT('Approximately '),
      VAR_TOKEN_NAME(),
      VAR_RECEIVE_ADDRESS('to '),
    ],
  },
  {
    id: 'rug-community',
    name: 'Community Warning',
    categoryId: 'rug-pull',
    emoji: '🚩',
    template:
      'PUBLIC NOTICE: The project ${project_name} has been identified as a rug pull. ' +
      'This address (the recipient of this message) drained${amount? approximately ${amount}}${token_name? ${token_name}} from the project. ' +
      'DO NOT interact with any new tokens or contracts deployed by this wallet. ' +
      'This record is permanent and searchable on-chain.',
    description: 'Public warning to the community about a rug-pulled project',
    variables: [
      VAR_PROJECT_NAME('project '),
      VAR_AMOUNT('approximately '),
      VAR_TOKEN_NAME(),
    ],
  },

  // ── Approval Exploit ──────────────────────────────────────────────
  {
    id: 'approval-revoke',
    name: 'Revoke Alert',
    categoryId: 'approval-exploit',
    emoji: '🚨',
    template:
      'WARNING TO ALL HOLDERS: The contract at ${contract_address} has been exploiting token approvals. ' +
      '${token_name? If you have approved ${token_name} for this contract, }REVOKE YOUR APPROVAL IMMEDIATELY using revoke.cash or your wallet\'s approval manager. ' +
      '${amount? Approximately ${amount}}${token_name? ${token_name}} has already been drained from ${exploited_address} and other victims.',
    description: 'Urgent alert to revoke malicious token approvals',
    variables: [
      VAR_CONTRACT_ADDRESS('contract at '),
      VAR_TOKEN_NAME('approved '),
      VAR_AMOUNT('Approximately '),
      VAR_EXPLOITED_ADDRESS('from '),
    ],
  },
  {
    id: 'approval-demand',
    name: 'Funds Recovery Demand',
    categoryId: 'approval-exploit',
    emoji: '💰',
    template:
      'You exploited token approvals via contract ${contract_address} to drain${amount? ${amount}}${token_name? ${token_name}} from multiple wallets including ${exploited_address}. ' +
      'All exploit transactions have been traced and documented. ' +
      'Return stolen funds to ${receive_address}${deadline? by ${deadline}}. ' +
      'Exchanges have been notified and are monitoring for deposits from flagged addresses.',
    description: 'Direct demand to approval exploiter with evidence mention',
    variables: [
      VAR_CONTRACT_ADDRESS('contract '),
      VAR_AMOUNT('drain '),
      VAR_TOKEN_NAME(),
      VAR_EXPLOITED_ADDRESS('including '),
      VAR_RECEIVE_ADDRESS('to '),
      VAR_DEADLINE('by '),
    ],
  },

  // ── Public Warning ────────────────────────────────────────────────
  {
    id: 'warning-identity',
    name: 'Identity Warning',
    categoryId: 'public-warning',
    emoji: '🔍',
    template:
      'PUBLIC RECORD: This address is associated with ${spammer_address} and has been identified in connection with fraudulent activity involving ${project_name}. ' +
      '${amount? Approximately ${amount}}${token_name? ${token_name}} has been stolen across multiple victims. ' +
      'This on-chain record serves as a permanent warning to all future counterparties.',
    description: 'Link a scammer identity to their wallet on-chain',
    variables: [
      VAR_SPAMMER_ADDRESS('with '),
      VAR_PROJECT_NAME('involving '),
      VAR_AMOUNT('Approximately '),
      VAR_TOKEN_NAME(),
    ],
  },
  {
    id: 'warning-exchange',
    name: 'Exchange / Bridge Alert',
    categoryId: 'public-warning',
    emoji: '🏦',
    template:
      'EXCHANGE & BRIDGE NOTICE: Funds from address ${spammer_address} are proceeds of theft${amount? — ${amount}}${token_name? ${token_name}} stolen from ${exploited_address}. ' +
      'Any deposits from this wallet or associated addresses should be frozen and investigated. ' +
      'Legitimate owner recovery address: ${receive_address}. ' +
      'Contact victim via the sending address of this transaction for verification.',
    description: 'Alert exchanges/bridges to freeze stolen funds',
    variables: [
      VAR_SPAMMER_ADDRESS('address '),
      VAR_AMOUNT('— '),
      VAR_TOKEN_NAME(),
      VAR_EXPLOITED_ADDRESS('from '),
      VAR_RECEIVE_ADDRESS(': '),
    ],
  },

  // ── Whitehat Recovery (Reverse Direction) ────────────────────────────
  {
    id: 'whitehat-intro',
    name: 'Recovery Introduction',
    categoryId: 'whitehat-recovery',
    emoji: '👋',
    template:
      'Hello, I recovered ${recovered_amount}${token_name? ${token_name}} that was taken from your address ${victim_address}. ' +
      'The funds are currently held at ${recovery_address}. ' +
      'Please contact me via the sending address of this transaction to arrange return of your funds. ' +
      'I am a whitehat security researcher and recovered these funds to prevent further loss.',
    description: 'Initial contact from whitehat to victim - friendly introduction',
    variables: [
      VAR_RECOVERED_AMOUNT('recovered '),
      VAR_TOKEN_NAME(),
      VAR_VICTIM_ADDRESS('address '),
      VAR_RECOVERY_ADDRESS('at '),
    ],
  },
  {
    id: 'whitehat-bounty-offer',
    name: 'Bounty Proposal',
    categoryId: 'whitehat-recovery',
    emoji: '💼',
    template:
      'I recovered ${recovered_amount}${token_name? ${token_name}} that was taken from ${victim_address}. ' +
      'The funds are held at ${recovery_address}. ' +
      'I propose returning ${recovery_percentage}% to you and keeping ${bounty_percentage}% as a recovery bounty for my work. ' +
      'Please contact me via the sending address of this transaction if you agree to these terms.${deadline? Please respond by ${deadline}.}',
    description: 'Whitehat proposing a bounty split to victim',
    variables: [
      VAR_RECOVERED_AMOUNT('recovered '),
      VAR_TOKEN_NAME(),
      VAR_VICTIM_ADDRESS('from '),
      VAR_RECOVERY_ADDRESS('at '),
      VAR_RECOVERY_PERCENTAGE('returning '),
      VAR_DEADLINE('respond by '),
    ],
  },
  {
    id: 'whitehat-full-return',
    name: 'Full Return Offer',
    categoryId: 'whitehat-recovery',
    emoji: '🎁',
    template:
      'I recovered ${recovered_amount}${token_name? ${token_name}} that was taken from ${victim_address}. ' +
      'The funds are currently held at ${recovery_address}. ' +
      'I am offering to return 100% of the recovered funds to you. ' +
      'Please contact me via the sending address of this transaction to arrange the return. ' +
      'No bounty requested - this is a goodwill recovery.',
    description: 'Whitehat offering full return with no bounty',
    variables: [
      VAR_RECOVERED_AMOUNT('recovered '),
      VAR_TOKEN_NAME(),
      VAR_VICTIM_ADDRESS('from '),
      VAR_RECOVERY_ADDRESS('at '),
    ],
  },
  {
    id: 'whitehat-verification',
    name: 'Verification Request',
    categoryId: 'whitehat-recovery',
    emoji: '✅',
    template:
      'I recovered funds that may belong to ${victim_address}. ' +
      'To verify ownership and arrange return, please: ' +
      '1) Sign a message from ${victim_address} proving control, ' +
      '2) Contact me via the sending address of this transaction with the signature. ' +
      'Recovered amount: ${recovered_amount}${token_name? ${token_name}}. ' +
      'Funds held at: ${recovery_address}.',
    description: 'Whitehat requesting verification before returning funds',
    variables: [
      VAR_VICTIM_ADDRESS('belong to '),
      VAR_RECOVERED_AMOUNT(': '),
      VAR_TOKEN_NAME(),
      VAR_RECOVERY_ADDRESS(': '),
    ],
  },
]

// ── Helpers ─────────────────────────────────────────────────────────

/** Get all templates for a specific category */
export function getTemplatesByCategory(categoryId: TemplateCategoryId): MessageTemplate[] {
  return messageTemplates.filter((t) => t.categoryId === categoryId)
}

/** Find a single template by its unique id */
export function getTemplateById(id: string): MessageTemplate | undefined {
  return messageTemplates.find((t) => t.id === id)
}

/**
 * Apply variable values to a template string.
 * Replaces all `${key}` placeholders with the corresponding value.
 * Supports conditional blocks: `${key? text with ${key} }` - only shown if key has value.
 * Unfilled required variables are shown as `[key]` for visibility.
 * Unfilled optional variables are removed (empty string).
 */
export function applyTemplate(
  template: string,
  variables: Record<string, string>,
  templateObj?: MessageTemplate,
): string {
  // Compute bounty_percentage from recovery_percentage if not provided
  // bounty_percentage = 100 - recovery_percentage
  if (!variables.bounty_percentage && variables.recovery_percentage) {
    try {
      const recoveryPct = parseInt(variables.recovery_percentage)
      if (!isNaN(recoveryPct) && recoveryPct > 0 && recoveryPct <= 100) {
        variables.bounty_percentage = String(100 - recoveryPct)
      }
    } catch {
      // Ignore parsing errors
    }
  }

  // First, process conditional blocks ${key? ... }
  // Properly handle nested braces by using a proper parser
  let result = template

  // Process conditionals iteratively until no more are found
  let changed = true
  let iterations = 0
  const maxIterations = 50

  while (changed && iterations < maxIterations) {
    iterations++
    changed = false
    const before = result

    // Find conditional blocks - match from right to left to handle nested ones first
    // Pattern: ${key? content} - need to find the matching closing brace
    const conditionalRegex = /\$\{(\w+)\?\s*/g
    let match: RegExpExecArray | null
    const matches: Array<{ start: number; end: number; key: string; content: string }> = []

    // Collect all matches first (process from end to start)
    while ((match = conditionalRegex.exec(result)) !== null) {
      const key = match[1] ?? ''
      const start = match.index
      let pos = match.index + match[0].length
      let depth = 1
      let contentStart = pos

      // Find matching closing brace
      while (pos < result.length && depth > 0) {
        if (result[pos] === '{') depth++
        else if (result[pos] === '}') depth--
        pos++
      }

      if (depth === 0) {
        const end = pos
        const content = result.substring(contentStart, end - 1)
        matches.push({ start, end, key, content })
      }
    }

    // Process matches from end to start (so we don't mess up indices)
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i]
      if (!match) continue
      const { start, end, key, content } = match
      const value = variables[key]

      if (!value || !value.trim()) {
        // Remove entire conditional block
        result = result.substring(0, start) + result.substring(end)
        changed = true
      } else {
        // Replace ${key} within the conditional content with the actual value
        const processedContent = content.replace(/\$\{(\w+)\}/g, (_m, innerKey: string) => {
          if (innerKey === key) return value.trim()
          const innerValue = variables[innerKey]
          return innerValue && innerValue.trim() ? innerValue.trim() : `[${innerKey}]`
        })
        result = result.substring(0, start) + processedContent + result.substring(end)
        changed = true
      }
    }

    if (before === result) changed = false
  }

  // Then process regular ${key} replacements
  result = result.replace(/\$\{(\w+)\}/g, (_match, key: string) => {
    const value = variables[key]
    if (value && value.trim()) return value.trim()

    // Check if this is an optional variable
    const isOptional = templateObj?.variables.find(v => v.key === key)?.optional
    return isOptional ? '' : `[${key}]`
  })

  return result
}

/** Extract all variable keys referenced in a template string */
export function extractVariableKeys(template: string): string[] {
  const keys: string[] = []
  const regex = /\$\{(\w+)\}/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(template)) !== null) {
    const key = match[1]
    if (key !== undefined && !keys.includes(key)) {
      keys.push(key)
    }
  }
  return keys
}
