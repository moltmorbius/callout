import type { MessageTemplate, TemplateVariable } from '../config/templates'
import { applyTemplate as applyVars } from '../config/templates'

/**
 * Apply variable values to a template, returning the filled message string.
 * Re-exports from config/templates for convenience.
 */
export function applyTemplate(
  template: MessageTemplate,
  variables: Record<string, string>,
): string {
  return applyVars(template.template, variables)
}

/**
 * Check whether all required variables for a template have been filled.
 * Returns `true` if every variable has a non-empty value.
 */
export function allVariablesFilled(
  template: MessageTemplate,
  variables: Record<string, string>,
): boolean {
  return template.variables.every((v) => {
    const val = variables[v.key]
    return val !== undefined && val.trim().length > 0
  })
}

/**
 * Validate a single variable value based on its type.
 * Returns an error message or `null` if valid.
 */
export function validateVariable(
  variable: TemplateVariable,
  value: string,
): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null // empty is not an error — just unfilled

  switch (variable.type) {
    case 'address':
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        return 'Must be a valid 0x address (42 characters)'
      }
      return null

    case 'number':
      if (!/^\d[\d,]*\.?\d*$/.test(trimmed)) {
        return 'Must be a valid number'
      }
      return null

    case 'date':
    case 'text':
    default:
      return null
  }
}

/**
 * Get the count of filled vs total variables for a template.
 */
export function getVariableProgress(
  template: MessageTemplate,
  variables: Record<string, string>,
): { filled: number; total: number } {
  const total = template.variables.length
  const filled = template.variables.filter((v) => {
    const val = variables[v.key]
    return val !== undefined && val.trim().length > 0
  }).length
  return { filled, total }
}
