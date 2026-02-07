/**
 * Interactive prepare flow: builds a complete transaction artifact.
 * Combines message encoding with target address and chain info.
 */

import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import SelectInput from 'ink-select-input'
import { encodeMessage } from '@callout/shared/encoding'
import { encryptMessage } from '@callout/shared/encryption'
import { validateAddress, validatePublicKey } from '@callout/shared/validation'
import { CHAIN_INFO } from '@callout/shared/types'
import { OutputDisplay } from './OutputDisplay.js'

interface Props {
  onDone: () => void
  onBack: () => void
}

type Step = 'target' | 'chain' | 'message' | 'encrypt_ask' | 'pubkey' | 'encrypting' | 'done'

const chainItems = Object.entries(CHAIN_INFO).map(([id, info]) => ({
  label: `${info.emoji} ${info.name} (${id})`,
  value: id,
}))

export function PrepareFlow({ onDone }: Props): React.ReactElement {
  const [step, setStep] = useState<Step>('target')
  const [target, setTarget] = useState('')
  const [savedTarget, setSavedTarget] = useState('')
  const [chainId, setChainId] = useState(1)
  const [message, setMessage] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [pubkey, setPubkey] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (result) {
    return <OutputDisplay data={result} onDone={onDone} />
  }

  if (step === 'encrypting') {
    return <Text bold>Encrypting...</Text>
  }

  return (
    <Box flexDirection="column">
      <Text bold>Prepare Transaction Artifact</Text>

      {step === 'target' && (
        <Box marginTop={1}>
          <Text color="yellow">Target address: </Text>
          <TextInput
            value={target}
            onChange={(val) => { setTarget(val); setError(null) }}
            onSubmit={(value) => {
              const validation = validateAddress(value)
              if (!validation.isValid) {
                setError(validation.error ?? 'Invalid address')
                return
              }
              setSavedTarget(value)
              setStep('chain')
            }}
            placeholder="0x... scammer/target address"
          />
          {error && <Text color="red">{error}</Text>}
        </Box>
      )}

      {step === 'chain' && (
        <>
          <Text dimColor>To: {savedTarget}</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="yellow">Select chain:</Text>
            <SelectInput
              items={chainItems}
              onSelect={(item) => {
                setChainId(parseInt(item.value))
                setStep('message')
              }}
            />
          </Box>
        </>
      )}

      {step === 'message' && (
        <>
          <Text dimColor>To: {savedTarget} | Chain: {CHAIN_INFO[chainId]?.name ?? chainId}</Text>
          <Box marginTop={1}>
            <Text color="yellow">Message: </Text>
            <TextInput
              value={message}
              onChange={setMessage}
              onSubmit={(value) => {
                if (!value.trim()) return
                setSavedMessage(value)
                setStep('encrypt_ask')
              }}
              placeholder="Type your message"
            />
          </Box>
        </>
      )}

      {step === 'encrypt_ask' && (
        <>
          <Text dimColor>To: {savedTarget} | Chain: {CHAIN_INFO[chainId]?.name ?? chainId}</Text>
          <Text dimColor>Message: {savedMessage.slice(0, 50)}{savedMessage.length > 50 ? '...' : ''}</Text>
          <Box marginTop={1}>
            <Text color="yellow">Encrypt the message?</Text>
          </Box>
          <SelectInput
            items={[
              { label: 'No — send as plaintext calldata', value: 'no' },
              { label: 'Yes — encrypt with recipient\'s public key', value: 'yes' },
            ]}
            onSelect={(item) => {
              if (item.value === 'yes') {
                setStep('pubkey')
              } else {
                const calldata = encodeMessage(savedMessage)
                setResult({
                  command: 'prepare',
                  transaction: {
                    to: savedTarget,
                    value: '0',
                    data: calldata,
                    chainId,
                  },
                  meta: {
                    message: savedMessage,
                    encrypted: false,
                    byteLength: (calldata.length - 2) / 2,
                    chain: CHAIN_INFO[chainId]?.name ?? `Chain ${chainId}`,
                    generatedAt: new Date().toISOString(),
                  },
                })
              }
            }}
          />
        </>
      )}

      {step === 'pubkey' && (
        <>
          <Text dimColor>To: {savedTarget} | Chain: {CHAIN_INFO[chainId]?.name ?? chainId}</Text>
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
                  const calldata = `0x${encrypted}`
                  setResult({
                    command: 'prepare',
                    transaction: {
                      to: savedTarget,
                      value: '0',
                      data: calldata,
                      chainId,
                    },
                    meta: {
                      message: savedMessage,
                      encrypted: true,
                      publicKey: value,
                      byteLength: encrypted.length / 2,
                      chain: CHAIN_INFO[chainId]?.name ?? `Chain ${chainId}`,
                      generatedAt: new Date().toISOString(),
                    },
                  })
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Encryption failed')
                  setStep('pubkey')
                }
              }}
              placeholder="0x04... uncompressed public key"
            />
          </Box>
          {error && <Text color="red">{error}</Text>}
        </>
      )}
    </Box>
  )
}
