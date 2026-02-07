import { describe, it, expect } from 'vitest'
import {
  messageTemplates,
  templateCategories,
  applyTemplate,
  interpolateTemplate,
  extractVariableKeys,
  getTemplatesByCategory,
  getTemplateById,
} from '@callout/shared/templates'

describe('messageTemplates', () => {
  it('has at least one template', () => {
    expect(messageTemplates.length).toBeGreaterThan(0)
  })

  it('every template has required fields', () => {
    for (const tpl of messageTemplates) {
      expect(tpl.id).toBeTruthy()
      expect(tpl.name).toBeTruthy()
      expect(tpl.categoryId).toBeTruthy()
      expect(tpl.emoji).toBeTruthy()
      expect(tpl.template).toBeTruthy()
      expect(tpl.description).toBeTruthy()
      expect(Array.isArray(tpl.variables)).toBe(true)
    }
  })

  it('every template uses ${variable} placeholder syntax', () => {
    for (const tpl of messageTemplates) {
      expect(tpl.template).toMatch(/\$\{\w+\}/)
    }
  })

  it('has unique id values', () => {
    const ids = messageTemplates.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every template references a valid category', () => {
    const validCategoryIds = templateCategories.map((c) => c.id)
    for (const tpl of messageTemplates) {
      expect(validCategoryIds).toContain(tpl.categoryId)
    }
  })

  it('has templates in all defined categories', () => {
    for (const cat of templateCategories) {
      const templates = getTemplatesByCategory(cat.id)
      expect(templates.length).toBeGreaterThan(0)
    }
  })

  it('template variables match placeholders in template string', () => {
    // bounty_percentage is auto-computed from recovery_percentage, not declared as a variable
    const computedKeys = ['bounty_percentage']
    for (const tpl of messageTemplates) {
      const placeholderKeys = extractVariableKeys(tpl.template)
      const varKeys = tpl.variables.map((v) => v.key)
      for (const key of placeholderKeys) {
        if (!computedKeys.includes(key)) {
          expect(varKeys).toContain(key)
        }
      }
    }
  })
})

describe('interpolateTemplate', () => {
  it('replaces ${key} with the given value', () => {
    const template = 'Send funds to ${receive_address} immediately.'
    const result = interpolateTemplate(template, { receive_address: '0xDeAd...BeEf' })
    expect(result).toBe('Send funds to 0xDeAd...BeEf immediately.')
  })

  it('replaces multiple different placeholders', () => {
    const template = 'From ${exploited_address} stolen ${amount} ${token_name}'
    const result = interpolateTemplate(template, {
      exploited_address: '0x1234',
      amount: '100',
      token_name: 'ETH',
    })
    expect(result).toBe('From 0x1234 stolen 100 ETH')
  })

  it('falls back to [key] when empty string is provided', () => {
    const template = 'Send to ${receive_address}'
    const result = interpolateTemplate(template, { receive_address: '' })
    expect(result).toBe('Send to [receive_address]')
  })

  it('falls back to [key] when variable is missing', () => {
    const template = 'Send to ${receive_address}'
    const result = interpolateTemplate(template, {})
    expect(result).toBe('Send to [receive_address]')
  })

  it('leaves template unchanged if no placeholders', () => {
    const template = 'No placeholder here.'
    const result = interpolateTemplate(template, { receive_address: '0x1234' })
    expect(result).toBe('No placeholder here.')
  })
})

describe('applyTemplate', () => {
  it('works with actual MessageTemplate objects from the array', () => {
    const tpl = messageTemplates[0]!
    const values: Record<string, string> = {}
    for (const v of tpl.variables) {
      // Use appropriate test values based on variable type so auto-computed
      // fields like bounty_percentage (derived from recovery_percentage) work
      values[v.key] = v.type === 'number' ? '80' : '0xABCD'
    }
    const result = applyTemplate(tpl, values)
    expect(result).not.toMatch(/\[(\w+)\]/)
  })
})

describe('getTemplateById', () => {
  it('returns undefined for unknown id', () => {
    expect(getTemplateById('nonexistent')).toBeUndefined()
  })
})

describe('extractVariableKeys', () => {
  it('extracts unique keys from a template string', () => {
    const keys = extractVariableKeys('${a} and ${b} and ${a}')
    expect(keys).toEqual(['a', 'b'])
  })

  it('returns empty array when no placeholders', () => {
    expect(extractVariableKeys('no vars')).toEqual([])
  })
})
