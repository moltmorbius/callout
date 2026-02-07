/**
 * Main interactive CLI application (React Ink).
 *
 * Presents a menu of commands and delegates to sub-flows.
 */

import React, { useState } from 'react'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { EncodeFlow } from './EncodeFlow.js'
import { DecodeFlow } from './DecodeFlow.js'
import { EncryptFlow } from './EncryptFlow.js'
import { DecryptFlow } from './DecryptFlow.js'
import { TemplateFlow } from './TemplateFlow.js'
import { SignFlow } from './SignFlow.js'
import { PrepareFlow } from './PrepareFlow.js'

type Command = 'encode' | 'decode' | 'encrypt' | 'decrypt' | 'template' | 'sign' | 'prepare' | null

const menuItems = [
  { label: 'Encode     — Message → hex calldata', value: 'encode' as Command },
  { label: 'Decode     — Hex calldata → message', value: 'decode' as Command },
  { label: 'Encrypt    — Message → encrypted calldata (needs public key)', value: 'encrypt' as Command },
  { label: 'Decrypt    — Encrypted calldata → message (needs private key)', value: 'decrypt' as Command },
  { label: 'Template   — Fill a message template interactively', value: 'template' as Command },
  { label: 'Sign       — Sign a message with your private key', value: 'sign' as Command },
  { label: 'Prepare    — Build a complete transaction artifact', value: 'prepare' as Command },
]

export function App(): React.ReactElement {
  const [command, setCommand] = useState<Command>(null)
  const [done, setDone] = useState(false)

  if (done) {
    return <Text color="green">Done.</Text>
  }

  if (!command) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="red">Callout</Text>
          <Text> — Offline artifact generator</Text>
        </Box>
        <Text dimColor>Select a command:</Text>
        <SelectInput items={menuItems} onSelect={(item) => setCommand(item.value)} />
      </Box>
    )
  }

  const onDone = () => setDone(true)
  const onBack = () => setCommand(null)

  switch (command) {
    case 'encode': return <EncodeFlow onDone={onDone} onBack={onBack} />
    case 'decode': return <DecodeFlow onDone={onDone} onBack={onBack} />
    case 'encrypt': return <EncryptFlow onDone={onDone} onBack={onBack} />
    case 'decrypt': return <DecryptFlow onDone={onDone} onBack={onBack} />
    case 'template': return <TemplateFlow onDone={onDone} onBack={onBack} />
    case 'sign': return <SignFlow onDone={onDone} onBack={onBack} />
    case 'prepare': return <PrepareFlow onDone={onDone} onBack={onBack} />
    default: return <Text color="red">Unknown command</Text>
  }
}
