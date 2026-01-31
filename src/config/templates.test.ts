import { describe, it, expect } from 'vitest'
import { messageTemplates, applyTemplate, type MessageTone } from './templates'

describe('messageTemplates', () => {
  it('has at least one template', () => {
    expect(messageTemplates.length).toBeGreaterThan(0)
  })

  it('every template has required fields', () => {
    for (const tpl of messageTemplates) {
      expect(tpl.tone).toBeTruthy()
      expect(tpl.label).toBeTruthy()
      expect(tpl.color).toBeTruthy()
      expect(tpl.emoji).toBeTruthy()
      expect(tpl.template).toBeTruthy()
      expect(tpl.description).toBeTruthy()
    }
  })

  it('every template uses [address] placeholder', () => {
    for (const tpl of messageTemplates) {
      expect(tpl.template).toContain('[address]')
    }
  })

  it('has unique tone values', () => {
    const tones = messageTemplates.map((t) => t.tone)
    expect(new Set(tones).size).toBe(tones.length)
  })

  it('tones are valid MessageTone values', () => {
    const validTones: MessageTone[] = ['cordial', 'firm', 'hostile', 'custom']
    for (const tpl of messageTemplates) {
      expect(validTones).toContain(tpl.tone)
    }
  })

  it('has the expected three tones: cordial, firm, hostile', () => {
    const tones = messageTemplates.map((t) => t.tone)
    expect(tones).toContain('cordial')
    expect(tones).toContain('firm')
    expect(tones).toContain('hostile')
  })
})

describe('applyTemplate', () => {
  it('replaces [address] with the given address', () => {
    const template = 'Send funds to [address] immediately.'
    const result = applyTemplate(template, '0xDeAd...BeEf')
    expect(result).toBe('Send funds to 0xDeAd...BeEf immediately.')
  })

  it('replaces multiple [address] occurrences', () => {
    const template = 'From [address] to [address]'
    const result = applyTemplate(template, '0x1234')
    expect(result).toBe('From 0x1234 to 0x1234')
  })

  it('falls back to [address] when empty string is provided', () => {
    const template = 'Send to [address]'
    const result = applyTemplate(template, '')
    expect(result).toBe('Send to [address]')
  })

  it('works with actual templates from the array', () => {
    const tpl = messageTemplates[0]
    const result = applyTemplate(tpl.template, '0xABCD')
    expect(result).not.toContain('[address]')
    expect(result).toContain('0xABCD')
  })

  it('leaves template unchanged if no [address] placeholder', () => {
    const template = 'No placeholder here.'
    const result = applyTemplate(template, '0x1234')
    expect(result).toBe('No placeholder here.')
  })
})
