/**
 * Interactive encode flow: message → hex calldata
 */

import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { encodeMessage } from '@callout/shared/encoding'
import { OutputDisplay } from './OutputDisplay.js'

interface Props {
  onDone: () => void
  onBack: () => void
}

export function EncodeFlow({ onDone }: Props): React.ReactElement {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  if (result) {
    return <OutputDisplay data={result} onDone={onDone} />
  }

  return (
    <Box flexDirection="column">
      <Text bold>Encode Message → Calldata</Text>
      <Box marginTop={1}>
        <Text color="yellow">Message: </Text>
        <TextInput
          value={message}
          onChange={setMessage}
          onSubmit={(value) => {
            if (!value.trim()) return
            const calldata = encodeMessage(value)
            setResult({
              command: 'encode',
              message: value,
              calldata,
              byteLength: (calldata.length - 2) / 2,
            })
          }}
          placeholder="Type your message and press enter"
        />
      </Box>
    </Box>
  )
}
