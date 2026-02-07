/**
 * Template categories and message templates.
 * Pure data — no side effects, no environment dependencies.
 */

import type { TemplateCategory, MessageTemplate } from './types.js'
import {
  VAR_EXPLOITED_ADDRESS,
  VAR_RECOVERY_PERCENTAGE,
  VAR_AMOUNT,
  VAR_TOKEN_NAME,
  VAR_RECEIVE_ADDRESS,
  VAR_DEADLINE,
  VAR_THEFT_TX_HASH,
  VAR_CHAIN_ID,
  VAR_PROJECT_NAME,
  VAR_CONTRACT_ADDRESS,
  VAR_SPAMMER_ADDRESS,
  VAR_VICTIM_ADDRESS,
  VAR_RECOVERY_ADDRESS,
  VAR_RECOVERED_AMOUNT,
} from './variables.js'

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

  // ── Whitehat Recovery ────────────────────────────────────────────
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
export function getTemplatesByCategory(categoryId: string): MessageTemplate[] {
  return messageTemplates.filter((t) => t.categoryId === categoryId)
}

/** Find a single template by its unique id */
export function getTemplateById(id: string): MessageTemplate | undefined {
  return messageTemplates.find((t) => t.id === id)
}
