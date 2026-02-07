/**
 * Template verification script
 * Tests all templates with optional variables both provided and not provided
 */

import { messageTemplates, applyTemplate } from './src/config/templates'

// Test data
const testAddress = '0x1234567890123456789012345678901234567890'
const testAmount = '150,000'
const testToken = 'ETH'
const testProject = 'TestProject'
const testDeadline = '48 hours'
const testTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
const testChainId = '369'
const testPercentage = '90'

function testTemplate(template: typeof messageTemplates[0]) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Template: ${template.name} (${template.id})`)
  console.log(`${'='.repeat(80)}`)

  // Get all variable keys
  const allKeys = template.variables.map(v => v.key)
  const requiredKeys = template.variables.filter(v => !v.optional).map(v => v.key)
  const optionalKeys = template.variables.filter(v => v.optional).map(v => v.key)

  console.log(`\nRequired variables: ${requiredKeys.join(', ') || '(none)'}`)
  console.log(`Optional variables: ${optionalKeys.join(', ') || '(none)'}`)

  // Test 1: All variables provided
  console.log(`\n--- Test 1: All variables provided ---`)
  const allVars: Record<string, string> = {}
  for (const v of template.variables) {
    switch (v.key) {
      case 'receive_address':
      case 'exploited_address':
      case 'spammer_address':
      case 'victim_address':
      case 'recovery_address':
      case 'contract_address':
        allVars[v.key] = testAddress
        break
      case 'amount':
      case 'recovered_amount':
        allVars[v.key] = testAmount
        break
      case 'token_name':
        allVars[v.key] = testToken
        break
      case 'project_name':
        allVars[v.key] = testProject
        break
      case 'deadline':
        allVars[v.key] = testDeadline
        break
      case 'theft_tx_hash':
        allVars[v.key] = testTxHash
        break
      case 'chain_id':
        allVars[v.key] = testChainId
        break
      case 'recovery_percentage':
        allVars[v.key] = testPercentage
        break
      default:
        allVars[v.key] = `[${v.key}]`
    }
  }
  const result1 = applyTemplate(template.template, allVars, template)
  console.log(result1)
  if (result1.includes('}}') || result1.includes('{{') || result1.includes('${')) {
    console.error('❌ ERROR: Contains unresolved template syntax!')
  } else {
    console.log('✅ OK')
  }

  // Test 2: Only required variables (optional empty)
  if (optionalKeys.length > 0) {
    console.log(`\n--- Test 2: Only required variables (optional empty) ---`)
    const requiredVars: Record<string, string> = {}
    for (const v of template.variables) {
      if (!v.optional) {
        switch (v.key) {
          case 'receive_address':
          case 'exploited_address':
          case 'spammer_address':
          case 'victim_address':
          case 'recovery_address':
          case 'contract_address':
            requiredVars[v.key] = testAddress
            break
          case 'amount':
          case 'recovered_amount':
            requiredVars[v.key] = testAmount
            break
          case 'token_name':
            requiredVars[v.key] = testToken
            break
          case 'project_name':
            requiredVars[v.key] = testProject
            break
          case 'deadline':
            requiredVars[v.key] = testDeadline
            break
          case 'theft_tx_hash':
            requiredVars[v.key] = testTxHash
            break
          case 'chain_id':
            requiredVars[v.key] = testChainId
            break
          case 'recovery_percentage':
            requiredVars[v.key] = testPercentage
            break
          default:
            requiredVars[v.key] = `[${v.key}]`
        }
      }
    }
    const result2 = applyTemplate(template.template, requiredVars, template)
    console.log(result2)
    if (result2.includes('}}') || result2.includes('{{') || result2.match(/\$\{[^}]+\}/)) {
      console.error('❌ ERROR: Contains unresolved template syntax!')
    } else if (result2.includes('  ') || result2.match(/\.\s+\./) || result2.match(/,\s+,/)) {
      console.warn('⚠️  WARNING: May have double spaces or punctuation issues')
    } else {
      console.log('✅ OK')
    }
  }

  // Test 3: Check for incomplete sentences
  console.log(`\n--- Test 3: Sentence completeness check ---`)
  const requiredOnly: Record<string, string> = {}
  for (const v of template.variables) {
    if (!v.optional) {
      switch (v.key) {
        case 'receive_address':
        case 'exploited_address':
        case 'spammer_address':
        case 'victim_address':
        case 'recovery_address':
        case 'contract_address':
          requiredOnly[v.key] = testAddress
          break
        case 'amount':
        case 'recovered_amount':
          requiredOnly[v.key] = testAmount
          break
        case 'token_name':
          requiredOnly[v.key] = testToken
          break
        case 'project_name':
          requiredOnly[v.key] = testProject
          break
        case 'deadline':
          requiredOnly[v.key] = testDeadline
          break
        case 'theft_tx_hash':
          requiredOnly[v.key] = testTxHash
          break
        case 'chain_id':
          requiredOnly[v.key] = testChainId
          break
        case 'recovery_percentage':
          requiredOnly[v.key] = testPercentage
          break
        default:
          requiredOnly[v.key] = `[${v.key}]`
      }
    }
  }
  const result3 = applyTemplate(template.template, requiredOnly, template)

  // Check for sentences that start with lowercase (incomplete)
  const sentences = result3.split(/[.!?]\s+/).filter(s => s.trim().length > 0)
  const incompleteSentences = sentences.filter(s => {
    const trimmed = s.trim()
    return trimmed.length > 0 && trimmed[0] === trimmed[0].toLowerCase() && trimmed[0].match(/[a-z]/)
  })

  if (incompleteSentences.length > 0) {
    console.warn('⚠️  WARNING: Found sentences starting with lowercase:')
    incompleteSentences.forEach(s => console.warn(`   "${s.substring(0, 60)}..."`))
  } else {
    console.log('✅ All sentences start properly')
  }
}

// Run verification for all templates
console.log('Template Verification Report')
console.log('='.repeat(80))

let errorCount = 0
let warningCount = 0

for (const template of messageTemplates) {
  try {
    testTemplate(template)
  } catch (error) {
    console.error(`\n❌ FATAL ERROR in template ${template.id}:`, error)
    errorCount++
  }
}

console.log(`\n${'='.repeat(80)}`)
console.log('Verification Complete')
console.log(`${'='.repeat(80)}`)
