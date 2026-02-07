/**
 * Displays a JSON artifact result and optionally writes to file.
 */

import React, { useEffect, useState } from 'react'
import { writeFileSync } from 'node:fs'
import { Box, Text, useApp } from 'ink'

interface OutputDisplayProps {
  data: Record<string, unknown>
  outputPath?: string
  onDone?: () => void
  onBack?: () => void
}

export function OutputDisplay({ data, outputPath, onDone }: OutputDisplayProps): React.ReactElement {
  const { exit } = useApp()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (outputPath && !saved) {
      try {
        writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
        setSaved(true)
      } catch {
        // Display error inline
      }
    }
  }, [outputPath, data, saved])

  // Auto-exit after rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone?.()
      exit()
    }, 100)
    return () => clearTimeout(timer)
  }, [exit, onDone])

  const json = JSON.stringify(data, null, 2)

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="green">Result:</Text>
      </Box>
      <Text>{json}</Text>
      {outputPath && saved && (
        <Box marginTop={1}>
          <Text color="green">Saved to {outputPath}</Text>
        </Box>
      )}
    </Box>
  )
}
