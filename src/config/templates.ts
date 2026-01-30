export type MessageTone = 'cordial' | 'firm' | 'hostile' | 'custom'

export interface MessageTemplate {
  tone: MessageTone
  label: string
  color: string
  emoji: string
  template: string
  description: string
}

export const messageTemplates: MessageTemplate[] = [
  {
    tone: 'cordial',
    label: 'Cordial',
    color: 'green',
    emoji: '🤝',
    template:
      "We noticed funds were transferred from our address. We'd appreciate their return to [address]. Thank you.",
    description: 'Polite and professional — assumes good faith',
  },
  {
    tone: 'firm',
    label: 'Firm',
    color: 'yellow',
    emoji: '⚠️',
    template:
      'Funds were taken without authorization. Return them to [address] within 48 hours. All transactions are being monitored.',
    description: 'Direct and assertive — sets a deadline',
  },
  {
    tone: 'hostile',
    label: 'Hostile',
    color: 'red',
    emoji: '🚨',
    template:
      'Stolen funds are being tracked. Law enforcement has been notified. Return to [address] immediately. All on-chain activity is recorded permanently.',
    description: 'Maximum pressure — implies consequences',
  },
]

export function applyTemplate(template: string, returnAddress: string): string {
  return template.replace(/\[address\]/g, returnAddress || '[address]')
}
