/**
 * Secure text input — masks all characters so private keys
 * are never displayed in the terminal or stored in history.
 */

import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'

interface SecureInputProps {
  label: string
  placeholder?: string
  onSubmit: (value: string) => void
}

export function SecureInput({ label, placeholder, onSubmit }: SecureInputProps): React.ReactElement {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useInput((input, key) => {
    if (submitted) return

    if (key.return) {
      setSubmitted(true)
      onSubmit(value)
      return
    }

    if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1))
      return
    }

    // Ignore control characters
    if (key.ctrl || key.meta || key.escape) return

    // Only accept printable characters
    if (input && input.length === 1 && input.charCodeAt(0) >= 32) {
      setValue((prev) => prev + input)
    }
  })

  if (submitted) {
    return (
      <Box>
        <Text color="green">{label}: </Text>
        <Text dimColor>[{value.length} characters entered]</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Text color="yellow">{label}: </Text>
      {value.length > 0 ? (
        <Text>{'*'.repeat(Math.min(value.length, 8))}{'·'.repeat(Math.max(0, value.length - 8))}</Text>
      ) : (
        <Text dimColor>{placeholder ?? 'type and press enter'}</Text>
      )}
    </Box>
  )
}
