/**
 * Interactive template selection and variable filling.
 * Outputs the filled message as calldata.
 */

import React, { useState } from 'react'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import TextInput from 'ink-text-input'
import {
  templateCategories,
  getTemplatesByCategory,
  getTemplateById,
  applyTemplate,
  allVariablesFilled,
  type MessageTemplate,
  type TemplateCategory,
} from '@callout/shared/templates'
import { encodeMessage } from '@callout/shared/encoding'
import { OutputDisplay } from './OutputDisplay.js'

interface Props {
  templateId?: string
  outputPath?: string
  targetAddress?: string
  onDone?: () => void
  onBack?: () => void
}

type Step = 'category' | 'template' | 'variables' | 'preview' | 'done'

export function TemplateFlow({ templateId, outputPath, onDone }: Props): React.ReactElement {
  const [step, setStep] = useState<Step>(templateId ? 'variables' : 'category')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(
    templateId ? (getTemplateById(templateId) ?? null) : null
  )
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [currentVarIndex, setCurrentVarIndex] = useState(0)
  const [currentVarValue, setCurrentVarValue] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  if (result) {
    return <OutputDisplay data={result} outputPath={outputPath} onDone={onDone} />
  }

  // Step 1: Select category
  if (step === 'category') {
    const items = templateCategories.map((cat) => ({
      label: `${cat.emoji} ${cat.name} — ${cat.description}`,
      value: cat.id,
    }))

    return (
      <Box flexDirection="column">
        <Text bold>Select Template Category</Text>
        <Box marginTop={1}>
          <SelectInput
            items={items}
            onSelect={(item) => {
              const cat = templateCategories.find((c) => c.id === item.value)
              if (cat) {
                setSelectedCategory(cat)
                setStep('template')
              }
            }}
          />
        </Box>
      </Box>
    )
  }

  // Step 2: Select template
  if (step === 'template' && selectedCategory) {
    const templates = getTemplatesByCategory(selectedCategory.id)
    const items = templates.map((t) => ({
      label: `${t.emoji} ${t.name} — ${t.description}`,
      value: t.id,
    }))

    return (
      <Box flexDirection="column">
        <Text bold>{selectedCategory.emoji} {selectedCategory.name}</Text>
        <Box marginTop={1}>
          <SelectInput
            items={items}
            onSelect={(item) => {
              const tmpl = getTemplateById(item.value)
              if (tmpl) {
                setSelectedTemplate(tmpl)
                setCurrentVarIndex(0)
                setCurrentVarValue('')
                setStep('variables')
              }
            }}
          />
        </Box>
      </Box>
    )
  }

  // Step 3: Fill variables
  if (step === 'variables' && selectedTemplate) {
    const vars = selectedTemplate.variables
    const currentVar = vars[currentVarIndex]

    if (!currentVar || allVariablesFilled(selectedTemplate, variables)) {
      // All variables filled — show preview
      setStep('preview')
      return <Text>Loading preview...</Text>
    }

    const filledSoFar = Object.entries(variables)
      .filter(([_, v]) => v.trim())
      .map(([k, v]) => `  ${k}: ${v}`)

    return (
      <Box flexDirection="column">
        <Text bold>{selectedTemplate.emoji} {selectedTemplate.name}</Text>
        <Text dimColor>Variable {currentVarIndex + 1} of {vars.length}</Text>

        {filledSoFar.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            {filledSoFar.map((line, i) => (
              <Text key={i} dimColor>{line}</Text>
            ))}
          </Box>
        )}

        <Box marginTop={1}>
          <Text color="yellow">{currentVar.label}{currentVar.optional ? ' (optional)' : ''}: </Text>
          <TextInput
            value={currentVarValue}
            onChange={setCurrentVarValue}
            onSubmit={(value) => {
              const trimmed = value.trim()
              // Allow empty for optional variables
              if (!trimmed && !currentVar.optional) return

              if (trimmed) {
                setVariables((prev) => ({ ...prev, [currentVar.key]: trimmed }))
              }
              setCurrentVarValue('')
              setCurrentVarIndex((prev) => prev + 1)
            }}
            placeholder={currentVar.placeholder}
          />
        </Box>
      </Box>
    )
  }

  // Step 4: Preview and confirm
  if (step === 'preview' && selectedTemplate) {
    const filled = applyTemplate(selectedTemplate, variables)
    const calldata = encodeMessage(filled)

    const items = [
      { label: 'Accept — output artifact', value: 'accept' },
      { label: 'Edit — go back to variables', value: 'edit' },
    ]

    return (
      <Box flexDirection="column">
        <Text bold>Message Preview:</Text>
        <Box marginTop={1} borderStyle="round" paddingX={1}>
          <Text>{filled}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Calldata: {calldata.slice(0, 40)}... ({(calldata.length - 2) / 2} bytes)</Text>
        </Box>
        <Box marginTop={1}>
          <SelectInput
            items={items}
            onSelect={(item) => {
              if (item.value === 'accept') {
                setResult({
                  command: 'template',
                  templateId: selectedTemplate.id,
                  templateName: selectedTemplate.name,
                  variables,
                  message: filled,
                  calldata,
                  byteLength: (calldata.length - 2) / 2,
                })
              } else {
                setCurrentVarIndex(0)
                setCurrentVarValue('')
                setVariables({})
                setStep('variables')
              }
            }}
          />
        </Box>
      </Box>
    )
  }

  return <Text color="red">Unexpected state</Text>
}
