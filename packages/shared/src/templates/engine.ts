/**
 * Template engine — applies variable values to template strings.
 *
 * Supports:
 * - Simple substitution: ${key}
 * - Conditional blocks: ${key? text with ${key} } — only shown if key has value
 * - Auto-computed bounty_percentage = 100 - recovery_percentage
 */

import type { MessageTemplate, TemplateVariable } from './types.js'

/**
 * Apply variable values to a template, returning the filled message string.
 */
export function applyTemplate(
  template: MessageTemplate,
  variables: Record<string, string>,
): string {
  return interpolateTemplate(template.template, variables, template)
}

/**
 * Check whether all required variables for a template have been filled.
 * Returns `true` if every required (non-optional) variable has a non-empty value.
 */
export function allVariablesFilled(
  template: MessageTemplate,
  variables: Record<string, string>,
): boolean {
  return template.variables.every((v) => {
    if (v.optional) return true
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
 * Get the count of filled vs total REQUIRED variables for a template.
 */
export function getVariableProgress(
  template: MessageTemplate,
  variables: Record<string, string>,
): { filled: number; total: number } {
  const requiredVars = template.variables.filter(v => !v.optional)
  const total = requiredVars.length
  const filled = requiredVars.filter((v) => {
    const val = variables[v.key]
    return val !== undefined && val.trim().length > 0
  }).length
  return { filled, total }
}

/**
 * Apply variable values to a raw template string.
 * Handles conditional blocks and simple substitutions.
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>,
  templateObj?: MessageTemplate,
): string {
  // Compute bounty_percentage from recovery_percentage if not provided
  if (!variables['bounty_percentage'] && variables['recovery_percentage']) {
    try {
      const recoveryPct = parseInt(variables['recovery_percentage'])
      if (!isNaN(recoveryPct) && recoveryPct > 0 && recoveryPct <= 100) {
        variables['bounty_percentage'] = String(100 - recoveryPct)
      }
    } catch {
      // Ignore parsing errors
    }
  }

  let result = template

  // Process conditionals iteratively until no more are found
  let changed = true
  let iterations = 0
  const maxIterations = 50

  while (changed && iterations < maxIterations) {
    iterations++
    changed = false
    const before = result

    const conditionalRegex = /\$\{(\w+)\?\s*/g
    let match: RegExpExecArray | null
    const matches: Array<{ start: number; end: number; key: string; content: string }> = []

    while ((match = conditionalRegex.exec(result)) !== null) {
      const key = match[1] ?? ''
      const start = match.index
      let pos = match.index + match[0].length
      let depth = 1
      const contentStart = pos

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

    // Process matches from end to start
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i]
      if (!m) continue
      const { start, end, key, content } = m
      const value = variables[key]

      if (!value || !value.trim()) {
        result = result.substring(0, start) + result.substring(end)
        changed = true
      } else {
        const processedContent = content.replace(/\$\{(\w+)\}/g, (_match, innerKey: string) => {
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

  // Process regular ${key} replacements
  result = result.replace(/\$\{(\w+)\}/g, (_match, key: string) => {
    const value = variables[key]
    if (value && value.trim()) return value.trim()

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
