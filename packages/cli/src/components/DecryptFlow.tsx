/**
 * Interactive decrypt flow: encrypted calldata + private key → message
 * Private key is entered via SecureInput (never displayed).
 */

import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { decryptMessage } from '@callout/shared/encryption'
import { SecureInput } from './SecureInput.js'
import { OutputDisplay } from './OutputDisplay.js'

interface Props {
  onDone: () => void
  onBack: () => void
}

type Step = 'calldata' | 'privkey' | 'decrypting' | 'done'

export function DecryptFlow({ onDone }: Props): React.ReactElement {
  const [step, setStep] = useState<Step>('calldata')
  const [calldata, setCalldata] = useState('')
  const [savedCalldata, setSavedCalldata] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (result) {
    return <OutputDisplay data={result} onDone={onDone} />
  }

  if (step === 'decrypting') {
    return <Text bold>Decrypting...</Text>
  }

  return (
    <Box flexDirection="column">
      <Text bold>Decrypt Message</Text>

      {step === 'calldata' && (
        <Box marginTop={1}>
          <Text color="yellow">Encrypted calldata (hex): </Text>
          <TextInput
            value={calldata}
            onChange={setCalldata}
            onSubmit={(value) => {
              if (!value.trim()) return
              setSavedCalldata(value)
              setStep('privkey')
            }}
            placeholder="0x... encrypted hex data"
          />
        </Box>
      )}

      {step === 'privkey' && (
        <>
          <Box marginTop={1}>
            <Text dimColor>Calldata: {savedCalldata.slice(0, 30)}...</Text>
          </Box>
          <Box marginTop={1}>
            <SecureInput
              label="Private key"
              placeholder="paste your private key (hidden)"
              onSubmit={async (privateKey) => {
                if (!privateKey.trim()) {
                  setError('Private key is required')
                  return
                }
                setStep('decrypting')
                try {
                  const hex = savedCalldata.startsWith('0x') ? savedCalldata.slice(2) : savedCalldata
                  const decrypted = await decryptMessage(hex, privateKey.trim())
                  setResult({
                    command: 'decrypt',
                    calldata: savedCalldata,
                    message: decrypted,
                  })
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Decryption failed')
                  setStep('privkey')
                }
              }}
            />
          </Box>
          {error && <Text color="red">{error}</Text>}
        </>
      )}
    </Box>
  )
}
