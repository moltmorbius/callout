/**
 * Mock stdin/stdout helpers for testing interactive CLI components
 */

import { Writable, Readable } from 'stream'

/**
 * Creates a mock stdin stream that can be used to simulate user input
 * @param inputs - Array of input strings to simulate
 * @returns A readable stream that emits the provided inputs
 */
export function createMockStdin(inputs: string[] = []): Readable {
  const stdin = new Readable({
    read() {
      // No-op, we'll push manually
    },
  })

  // Push all inputs with a small delay to simulate typing
  inputs.forEach((input, index) => {
    setTimeout(() => {
      stdin.push(input)
      if (index === inputs.length - 1) {
        stdin.push(null) // End the stream
      }
    }, index * 10)
  })

  return stdin
}

/**
 * Creates a mock stdout stream that captures all output
 * @returns An object with the writable stream and a function to get the output
 */
export function createMockStdout(): {
  stream: Writable
  getOutput: () => string
  clear: () => void
} {
  let output = ''

  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString()
      callback()
    },
  })

  return {
    stream,
    getOutput: () => output,
    clear: () => {
      output = ''
    },
  }
}

/**
 * Creates a mock stderr stream that captures all error output
 * @returns An object with the writable stream and a function to get the output
 */
export function createMockStderr(): {
  stream: Writable
  getOutput: () => string
  clear: () => void
} {
  let output = ''

  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString()
      callback()
    },
  })

  return {
    stream,
    getOutput: () => output,
    clear: () => {
      output = ''
    },
  }
}

/**
 * Helper to simulate a sequence of user inputs with delays
 * @param stdin - The mock stdin stream
 * @param inputs - Array of inputs to send
 * @param delay - Delay between inputs in ms (default 10)
 */
export function simulateInput(
  stdin: Readable,
  inputs: string[],
  delay = 10
): void {
  inputs.forEach((input, index) => {
    setTimeout(() => {
      stdin.push(input)
      if (index === inputs.length - 1) {
        stdin.push(null)
      }
    }, index * delay)
  })
}
