/**
 * Interactive sign flow: message + private key → signed message with calldata
 * Private key entered via SecureInput (never displayed).
 */

import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { encodeMessage } from '@callout/shared/encoding'
import { SecureInput } from './SecureInput.js'
import { OutputDisplay } from './OutputDisplay.js'
import type { Hex } from 'viem'

interface Props {
  onDone: () => void
  onBack: () => void
}

type Step = 'message' | 'privkey' | 'signing' | 'done'

export function SignFlow({ onDone }: Props): React.ReactElement {
  const [step, setStep] = useState<Step>('message')
  const [message, setMessage] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (result) {
    return <OutputDisplay data={result} onDone={onDone} />
  }

  if (step === 'signing') {
    return <Text bold>Signing...</Text>
  }

  return (
    <Box flexDirection="column">
      <Text bold>Sign Message</Text>

      {step === 'message' && (
        <Box marginTop={1}>
          <Text color="yellow">Message: </Text>
          <TextInput
            value={message}
            onChange={setMessage}
            onSubmit={(value) => {
              if (!value.trim()) return
              setSavedMessage(value)
              setStep('privkey')
            }}
            placeholder="Type your message"
          />
        </Box>
      )}

      {step === 'privkey' && (
        <>
          <Box marginTop={1}>
            <Text dimColor>Message: {savedMessage.slice(0, 50)}{savedMessage.length > 50 ? '...' : ''}</Text>
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
                setStep('signing')
                try {
                  const { privateKeyToAccount } = await import('viem/accounts')
                  const account = privateKeyToAccount(privateKey.trim() as Hex)
                  const signature = await account.signMessage({ message: savedMessage })

                  const signedFormat = `MESSAGE: "${savedMessage}"\nSIGNATURE: ${signature}`
                  const calldata = encodeMessage(signedFormat)

                  setResult({
                    command: 'sign',
                    message: savedMessage,
                    signer: account.address,
                    signature,
                    signedFormat,
                    calldata,
                    byteLength: (calldata.length - 2) / 2,
                  })
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Signing failed')
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
