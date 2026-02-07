/**
 * Interactive encrypt flow: message + public key → encrypted calldata
 */

import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { encryptMessage } from '@callout/shared/encryption'
import { validatePublicKey } from '@callout/shared/validation'
import { OutputDisplay } from './OutputDisplay.js'

interface Props {
  onDone: () => void
  onBack: () => void
}

type Step = 'message' | 'pubkey' | 'encrypting' | 'done'

export function EncryptFlow({ onDone }: Props): React.ReactElement {
  const [step, setStep] = useState<Step>('message')
  const [message, setMessage] = useState('')
  const [pubkey, setPubkey] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (result) {
    return <OutputDisplay data={result} onDone={onDone} />
  }

  if (step === 'encrypting') {
    return (
      <Box flexDirection="column">
        <Text bold>Encrypting...</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text bold>Encrypt Message</Text>

      {step === 'message' && (
        <Box marginTop={1}>
          <Text color="yellow">Message: </Text>
          <TextInput
            value={message}
            onChange={setMessage}
            onSubmit={(value) => {
              if (!value.trim()) return
              setSavedMessage(value)
              setStep('pubkey')
            }}
            placeholder="Type your message"
          />
        </Box>
      )}

      {step === 'pubkey' && (
        <>
          <Box marginTop={1}>
            <Text dimColor>Message: {savedMessage.slice(0, 50)}{savedMessage.length > 50 ? '...' : ''}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="yellow">Recipient public key: </Text>
            <TextInput
              value={pubkey}
              onChange={(val) => { setPubkey(val); setError(null) }}
              onSubmit={async (value) => {
                if (!value.trim()) return
                const validation = validatePublicKey(value)
                if (!validation.isValid) {
                  setError(validation.error ?? 'Invalid public key')
                  return
                }
                setStep('encrypting')
                try {
                  const encrypted = await encryptMessage(savedMessage, value)
                  setResult({
                    command: 'encrypt',
                    message: savedMessage,
                    calldata: `0x${encrypted}`,
                    byteLength: encrypted.length / 2,
                    publicKey: value,
                  })
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Encryption failed')
                  setStep('pubkey')
                }
              }}
              placeholder="0x04... uncompressed public key (paste here)"
            />
          </Box>
          {error && <Text color="red">{error}</Text>}
        </>
      )}
    </Box>
  )
}
