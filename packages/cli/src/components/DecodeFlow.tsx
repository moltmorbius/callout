/**
 * Interactive decode flow: hex calldata → message
 */

import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { decodeMessage } from '@callout/shared/encoding'
import { isEncrypted } from '@callout/shared/encryption'
import type { Hex } from 'viem'
import { OutputDisplay } from './OutputDisplay.js'

interface Props {
  onDone: () => void
  onBack: () => void
}

export function DecodeFlow({ onDone }: Props): React.ReactElement {
  const [hex, setHex] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (result) {
    return <OutputDisplay data={result} onDone={onDone} />
  }

  return (
    <Box flexDirection="column">
      <Text bold>Decode Calldata → Message</Text>
      <Box marginTop={1}>
        <Text color="yellow">Calldata (hex): </Text>
        <TextInput
          value={hex}
          onChange={(val) => { setHex(val); setError(null) }}
          onSubmit={(value) => {
            if (!value.trim()) return
            try {
              const data = value.startsWith('0x') ? value : `0x${value}`
              const encrypted = isEncrypted(data)
              const message = decodeMessage(data as Hex)
              setResult({
                command: 'decode',
                calldata: data,
                message: encrypted ? '[encrypted — use decrypt command]' : message,
                encrypted,
              })
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to decode')
            }
          }}
          placeholder="0x... hex calldata"
        />
      </Box>
      {error && <Text color="red">{error}</Text>}
    </Box>
  )
}
