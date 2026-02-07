#!/usr/bin/env node
/**
 * @callout/cli — Offline callout artifact generator.
 *
 * Generate calldata artifacts for on-chain messages without exposing
 * private keys to dapp developers or network requests.
 */

import { render } from 'ink'
import meow from 'meow'
import { App } from './components/App.js'

const cli = meow(`
  Usage
    $ callout <command> [options]

  Commands
    encode       Encode a message as hex calldata
    decode       Decode hex calldata back to a message
    encrypt      Encrypt a message with a recipient's public key
    decrypt      Decrypt an encrypted message with your private key
    template     Select and fill a message template
    sign         Sign a message with your private key
    prepare      Prepare a complete transaction artifact (JSON)

  Options
    --message, -m    Message text (for encode/encrypt/sign)
    --data, -d       Hex calldata (for decode/decrypt)
    --pubkey, -k     Recipient's public key (for encrypt)
    --to, -t         Target address (for prepare)
    --chain, -c      Chain ID (for prepare, default: 1)
    --output, -o     Output file path (writes JSON artifact)
    --template-id    Template ID to use (skips interactive selection)
    --help, -h       Show this help message

  Examples
    $ callout encode -m "Return the funds"
    $ callout encrypt -m "Return the funds" -k 0x04abc...
    $ callout template
    $ callout prepare -t 0xScammer... -m "Return the funds"
    $ callout decode -d 0x52657475726e...
`, {
  importMeta: import.meta,
  flags: {
    message: { type: 'string', shortFlag: 'm' },
    data: { type: 'string', shortFlag: 'd' },
    pubkey: { type: 'string', shortFlag: 'k' },
    to: { type: 'string', shortFlag: 't' },
    chain: { type: 'number', shortFlag: 'c', default: 1 },
    output: { type: 'string', shortFlag: 'o' },
    templateId: { type: 'string' },
  },
})

const command = cli.input[0] ?? ''
const flags = cli.flags

// If no command provided, show interactive mode
if (!command) {
  const { waitUntilExit } = render(<App />)
  await waitUntilExit()
} else {
  // Command mode — import and run the specific command
  const { runCommand } = await import('./commands/runner.js')
  await runCommand(command, flags)
}
