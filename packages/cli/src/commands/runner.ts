/**
 * Non-interactive command runner.
 * Handles flag-based CLI invocations without the React Ink UI.
 */

import { writeFileSync } from 'node:fs'
import { encodeMessage, decodeMessage } from '@callout/shared/encoding'
import { encryptMessage, decryptMessage, isEncrypted } from '@callout/shared/encryption'
import { validateAddress, validatePublicKey } from '@callout/shared/validation'
import type { Hex } from 'viem'

interface Flags {
  message?: string
  data?: string
  pubkey?: string
  to?: string
  chain: number
  output?: string
  templateId?: string
}

function writeOutput(data: unknown, outputPath?: string): void {
  const json = JSON.stringify(data, null, 2)
  if (outputPath) {
    writeFileSync(outputPath, json, 'utf-8')
    console.log(`Artifact written to ${outputPath}`)
  } else {
    console.log(json)
  }
}

function fail(msg: string): never {
  console.error(`Error: ${msg}`)
  process.exit(1)
}

export async function runCommand(command: string, flags: Flags): Promise<void> {
  switch (command) {
    case 'encode': {
      if (!flags.message) fail('--message (-m) is required for encode')
      const calldata = encodeMessage(flags.message)
      writeOutput({
        command: 'encode',
        message: flags.message,
        calldata,
        byteLength: (calldata.length - 2) / 2,
      }, flags.output)
      break
    }

    case 'decode': {
      if (!flags.data) fail('--data (-d) is required for decode')
      const hex = flags.data.startsWith('0x') ? flags.data : `0x${flags.data}`
      const message = decodeMessage(hex as Hex)
      const encrypted = isEncrypted(hex)
      writeOutput({
        command: 'decode',
        calldata: hex,
        message: encrypted ? '[encrypted — use decrypt command]' : message,
        encrypted,
      }, flags.output)
      break
    }

    case 'encrypt': {
      if (!flags.message) fail('--message (-m) is required for encrypt')
      if (!flags.pubkey) fail('--pubkey (-k) is required for encrypt')
      const pkValidation = validatePublicKey(flags.pubkey)
      if (!pkValidation.isValid) fail(pkValidation.error ?? 'Invalid public key')

      const encrypted = await encryptMessage(flags.message, flags.pubkey)
      const calldata = `0x${encrypted}`
      writeOutput({
        command: 'encrypt',
        message: flags.message,
        calldata,
        byteLength: encrypted.length / 2,
        publicKey: flags.pubkey,
      }, flags.output)
      break
    }

    case 'decrypt': {
      if (!flags.data) fail('--data (-d) is required for decrypt')
      // Private key will be read from stdin for security
      console.error('Enter your private key (input is hidden):')
      const privateKey = await readStdin()
      if (!privateKey.trim()) fail('Private key is required for decryption')

      const hex = flags.data.startsWith('0x') ? flags.data.slice(2) : flags.data
      const decrypted = await decryptMessage(hex, privateKey.trim())
      writeOutput({
        command: 'decrypt',
        calldata: flags.data,
        message: decrypted,
      }, flags.output)
      break
    }

    case 'sign': {
      if (!flags.message) fail('--message (-m) is required for sign')
      // Private key will be read from stdin for security
      console.error('Enter your private key (input is hidden):')
      const privKey = await readStdin()
      if (!privKey.trim()) fail('Private key is required for signing')

      const { privateKeyToAccount } = await import('viem/accounts')
      const account = privateKeyToAccount(privKey.trim() as Hex)
      const signature = await account.signMessage({ message: flags.message })

      const signedFormat = `MESSAGE: "${flags.message}"\nSIGNATURE: ${signature}`
      const calldata = encodeMessage(signedFormat)

      writeOutput({
        command: 'sign',
        message: flags.message,
        signer: account.address,
        signature,
        signedFormat,
        calldata,
        byteLength: (calldata.length - 2) / 2,
      }, flags.output)
      break
    }

    case 'prepare': {
      if (!flags.to) fail('--to (-t) is required for prepare')
      const addrValidation = validateAddress(flags.to)
      if (!addrValidation.isValid) fail(addrValidation.error ?? 'Invalid target address')

      if (!flags.message && !flags.data) {
        fail('Either --message (-m) or --data (-d) is required for prepare')
      }

      let calldata: string
      if (flags.data) {
        calldata = flags.data.startsWith('0x') ? flags.data : `0x${flags.data}`
      } else {
        calldata = encodeMessage(flags.message!)
      }

      writeOutput({
        command: 'prepare',
        transaction: {
          to: flags.to,
          value: '0',
          data: calldata,
          chainId: flags.chain,
        },
        meta: {
          message: flags.message ?? null,
          byteLength: (calldata.length - 2) / 2,
          generatedAt: new Date().toISOString(),
        },
      }, flags.output)
      break
    }

    case 'template': {
      // Template command always launches interactive mode
      const React = await import('react')
      const { render } = await import('ink')
      const { TemplateFlow } = await import('../components/TemplateFlow.js')
      const { waitUntilExit } = render(
        React.createElement(TemplateFlow, {
          templateId: flags.templateId,
          outputPath: flags.output,
          targetAddress: flags.to,
        })
      )
      await waitUntilExit()
      break
    }

    default:
      fail(`Unknown command: ${command}. Run "callout --help" for usage.`)
  }
}

/** Read a line from stdin (for private key input). */
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf-8')
    if (process.stdin.isTTY) {
      // For TTY, read a single line
      process.stdin.once('data', (chunk: string) => {
        resolve(chunk.toString().trim())
      })
    } else {
      // For piped input, read all data
      process.stdin.on('data', (chunk: string) => { data += chunk })
      process.stdin.on('end', () => { resolve(data.trim()) })
    }
    process.stdin.resume()
  })
}
