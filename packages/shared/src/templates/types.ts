/**
 * Template system type definitions.
 */

/** Legacy tone type — kept for the custom free-form option */
export type MessageTone = 'custom'

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
  /** Label describing who the sender represents (e.g., "victim", "community member") */
  senderLabel: string
  /** Label describing who the target address represents (e.g., "scammer", "developer") */
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
