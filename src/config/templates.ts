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
}

// ── Template & category types ───────────────────────────────────────

export type TemplateCategoryId =
  | 'scam-recovery'
  | 'rug-pull'
  | 'approval-exploit'
  | 'public-warning'

export interface TemplateCategory {
  id: TemplateCategoryId
  name: string
  emoji: string
  color: string
  description: string
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
  },
  {
    id: 'rug-pull',
    name: 'Rug Pull',
    emoji: '🪤',
    color: 'yellow',
    description: 'Hold devs accountable on-chain',
  },
  {
    id: 'approval-exploit',
    name: 'Approval Exploit',
    emoji: '🔓',
    color: 'red',
    description: 'Warn about token approval abuse',
  },
  {
    id: 'public-warning',
    name: 'Public Warning',
    emoji: '📢',
    color: 'orange',
    description: 'Broadcast warnings to the ecosystem',
  },
]

// ── Reusable variable definitions ───────────────────────────────────

const VAR_RECEIVE_ADDRESS: TemplateVariable = {
  key: 'receive_address',
  label: 'Return Address',
  placeholder: '0x... address to return funds to',
  type: 'address',
}

const VAR_EXPLOITED_ADDRESS: TemplateVariable = {
  key: 'exploited_address',
  label: 'Exploited Address',
  placeholder: '0x... address that was exploited',
  type: 'address',
}

const VAR_SPAMMER_ADDRESS: TemplateVariable = {
  key: 'spammer_address',
  label: 'Scammer Address',
  placeholder: '0x... scammer / exploiter address',
  type: 'address',
}

const VAR_DEADLINE: TemplateVariable = {
  key: 'deadline',
  label: 'Deadline',
  placeholder: 'e.g. 48 hours, July 30 2025',
  type: 'text',
  optional: true,
}

const VAR_TOKEN_NAME: TemplateVariable = {
  key: 'token_name',
  label: 'Token Name',
  placeholder: 'e.g. ETH, USDC, PLS',
  type: 'text',
  optional: true,
}

const VAR_AMOUNT: TemplateVariable = {
  key: 'amount',
  label: 'Amount',
  placeholder: 'e.g. 150,000',
  type: 'text',
  optional: true,
}

const VAR_TX_HASH: TemplateVariable = {
  key: 'tx_hash',
  label: 'Transaction Hash',
  placeholder: '0x... transaction hash of the exploit',
  type: 'text',
  optional: true,
}

const VAR_PROJECT_NAME: TemplateVariable = {
  key: 'project_name',
  label: 'Project Name',
  placeholder: 'e.g. RocketSwap, SafeYield',
  type: 'text',
}

const VAR_CONTRACT_ADDRESS: TemplateVariable = {
  key: 'contract_address',
  label: 'Contract Address',
  placeholder: '0x... malicious contract address',
  type: 'address',
}

// ── Templates ───────────────────────────────────────────────────────

export const messageTemplates: MessageTemplate[] = [
  // ── Scam Recovery ─────────────────────────────────────────────────
  {
    id: 'scam-bounty-simple',
    name: 'White Hat Bounty (Simple)',
    categoryId: 'scam-recovery',
    emoji: '🤝',
    template:
      'We are offering a white hat bounty: return 90% of the funds to ${receive_address} and keep 10% as a legitimate bounty. This is a good-faith offer.',
    description: 'Simple bounty offer - clean and direct',
    variables: [VAR_RECEIVE_ADDRESS],
  },
  {
    id: 'scam-bounty',
    name: 'White Hat Bounty (Detailed)',
    categoryId: 'scam-recovery',
    emoji: '🤝',
    template:
      'This is a message regarding funds taken from ${exploited_address}. ' +
      'We are offering a white hat bounty: return 90% of the ${amount} ${token_name} to ${receive_address} and keep 10% as a legitimate bounty.${deadline? No further action will be pursued if funds are returned by ${deadline}.} This is a good-faith offer.',
    description: 'Detailed bounty offer with specific amounts',
    variables: [VAR_EXPLOITED_ADDRESS, VAR_AMOUNT, VAR_TOKEN_NAME, VAR_RECEIVE_ADDRESS, VAR_DEADLINE],
  },
  {
    id: 'scam-legal',
    name: 'Legal Threat',
    categoryId: 'scam-recovery',
    emoji: '⚖️',
    template:
      'NOTICE: Unauthorized transfer of ${amount} ${token_name} from ${exploited_address} has been documented. ' +
      'Blockchain forensics and law enforcement have been engaged. ' +
      'Return all funds to ${receive_address} immediately. ' +
      'Failure to comply will result in legal proceedings. All on-chain evidence is preserved permanently.',
    description: 'Formal legal notice with law enforcement mention',
    variables: [VAR_AMOUNT, VAR_TOKEN_NAME, VAR_EXPLOITED_ADDRESS, VAR_RECEIVE_ADDRESS],
  },
  {
    id: 'scam-deadline',
    name: 'Deadline Warning',
    categoryId: 'scam-recovery',
    emoji: '⏰',
    template:
      'FINAL WARNING: Return ${amount} ${token_name} to ${receive_address}${deadline? by ${deadline}}. ' +
      'All collected evidence including transaction traces, wallet clustering data, and exchange deposit records ' +
      'will be submitted to relevant authorities and published publicly. ' +
      'This is your last opportunity to resolve this without escalation.',
    description: 'Final deadline with specific consequences',
    variables: [VAR_DEADLINE, VAR_AMOUNT, VAR_TOKEN_NAME, VAR_RECEIVE_ADDRESS],
  },

  // ── Rug Pull ──────────────────────────────────────────────────────
  {
    id: 'rug-accountability',
    name: 'Developer Accountability',
    categoryId: 'rug-pull',
    emoji: '👤',
    template:
      'This address deployed and controlled ${project_name}. ' +
      'Approximately ${amount} ${token_name} in liquidity was removed without community consent. ' +
      'This message is an immutable, on-chain record of that action. ' +
      'Investors and future projects can verify this wallet\'s history permanently. ' +
      'Return funds to ${receive_address} to begin making this right.',
    description: 'On-chain record tying a dev wallet to a rug pull',
    variables: [VAR_PROJECT_NAME, VAR_AMOUNT, VAR_TOKEN_NAME, VAR_RECEIVE_ADDRESS],
  },
  {
    id: 'rug-community',
    name: 'Community Warning',
    categoryId: 'rug-pull',
    emoji: '🚩',
    template:
      'PUBLIC NOTICE: The project ${project_name} has been identified as a rug pull. ' +
      'This address (the recipient of this message) drained approximately ${amount} ${token_name} from the project. ' +
      'DO NOT interact with any new tokens or contracts deployed by this wallet. ' +
      'This record is permanent and searchable on-chain.',
    description: 'Public warning to the community about a rug-pulled project',
    variables: [VAR_PROJECT_NAME, VAR_AMOUNT, VAR_TOKEN_NAME],
  },

  // ── Approval Exploit ──────────────────────────────────────────────
  {
    id: 'approval-revoke',
    name: 'Revoke Alert',
    categoryId: 'approval-exploit',
    emoji: '🚨',
    template:
      'WARNING TO ALL HOLDERS: The contract at ${contract_address} has been exploiting token approvals. ' +
      'If you have approved ${token_name} for this contract, REVOKE YOUR APPROVAL IMMEDIATELY using revoke.cash or your wallet\'s approval manager. ' +
      'Approximately ${amount} ${token_name} has already been drained from ${exploited_address} and other victims.',
    description: 'Urgent alert to revoke malicious token approvals',
    variables: [VAR_CONTRACT_ADDRESS, VAR_TOKEN_NAME, VAR_AMOUNT, VAR_EXPLOITED_ADDRESS],
  },
  {
    id: 'approval-demand',
    name: 'Funds Recovery Demand',
    categoryId: 'approval-exploit',
    emoji: '💰',
    template:
      'You exploited token approvals via contract ${contract_address} to drain ${amount} ${token_name} from multiple wallets including ${exploited_address}. ' +
      'All exploit transactions have been traced and documented. ' +
      'Return stolen funds to ${receive_address}${deadline? by ${deadline}}. ' +
      'Exchanges have been notified and are monitoring for deposits from flagged addresses.',
    description: 'Direct demand to approval exploiter with evidence mention',
    variables: [VAR_CONTRACT_ADDRESS, VAR_AMOUNT, VAR_TOKEN_NAME, VAR_EXPLOITED_ADDRESS, VAR_RECEIVE_ADDRESS, VAR_DEADLINE],
  },

  // ── Public Warning ────────────────────────────────────────────────
  {
    id: 'warning-identity',
    name: 'Identity Warning',
    categoryId: 'public-warning',
    emoji: '🔍',
    template:
      'PUBLIC RECORD: This address is associated with ${spammer_address} and has been identified in connection with fraudulent activity involving ${project_name}. ' +
      'Approximately ${amount} ${token_name} has been stolen across multiple victims. ' +
      'This on-chain record serves as a permanent warning to all future counterparties.',
    description: 'Link a scammer identity to their wallet on-chain',
    variables: [VAR_SPAMMER_ADDRESS, VAR_PROJECT_NAME, VAR_AMOUNT, VAR_TOKEN_NAME],
  },
  {
    id: 'warning-exchange',
    name: 'Exchange / Bridge Alert',
    categoryId: 'public-warning',
    emoji: '🏦',
    template:
      'EXCHANGE & BRIDGE NOTICE: Funds from address ${spammer_address} are proceeds of theft — ${amount} ${token_name} stolen from ${exploited_address}. ' +
      'Any deposits from this wallet or associated addresses should be frozen and investigated. ' +
      'Legitimate owner recovery address: ${receive_address}. ' +
      'Contact victim via the sending address of this transaction for verification.',
    description: 'Alert exchanges/bridges to freeze stolen funds',
    variables: [VAR_SPAMMER_ADDRESS, VAR_AMOUNT, VAR_TOKEN_NAME, VAR_EXPLOITED_ADDRESS, VAR_RECEIVE_ADDRESS],
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
  // First, process conditional blocks ${key? ... }
  let result = template.replace(/\$\{(\w+)\?\s*([^}]+)\s*\}/g, (_match, key: string, content: string) => {
    const value = variables[key]
    if (!value || !value.trim()) return ''
    
    // Replace ${key} within the conditional content with the actual value
    return content.replace(/\$\{(\w+)\}/g, (_m, innerKey: string) => {
      if (innerKey === key) return value.trim()
      const innerValue = variables[innerKey]
      return innerValue && innerValue.trim() ? innerValue.trim() : `[${innerKey}]`
    })
  })
  
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
    if (!keys.includes(match[1])) {
      keys.push(match[1])
    }
  }
  return keys
}
