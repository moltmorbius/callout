/**
 * Tests for mock I/O helpers
 */

import { describe, it, expect } from 'vitest'
import {
  createMockStdin,
  createMockStdout,
  createMockStderr,
  simulateInput,
} from './mockIO'

describe('mockIO', () => {
  describe('createMockStdin', () => {
    it('should create a readable stream', () => {
      const stdin = createMockStdin(['test'])
      expect(stdin).toBeDefined()
      expect(stdin.readable).toBe(true)
    })

    it('should emit provided inputs', async () => {
      const inputs = ['line1\n', 'line2\n']
      const stdin = createMockStdin(inputs)
      const received: string[] = []

      stdin.on('data', (chunk) => {
        received.push(chunk.toString())
      })

      await new Promise<void>((resolve) => {
        stdin.on('end', () => {
          expect(received).toEqual(inputs)
          resolve()
        })
      })
    })

    it('should handle empty input array', () => {
      const stdin = createMockStdin([])
      expect(stdin).toBeDefined()
      expect(stdin.readable).toBe(true)
      // The stream will end immediately with empty input
    })

    it('should end the stream after all inputs', async () => {
      const stdin = createMockStdin(['test'])
      const chunks: string[] = []

      stdin.on('data', (chunk) => {
        chunks.push(chunk.toString())
      })

      await new Promise<void>((resolve) => {
        stdin.on('end', () => {
          resolve()
        })
      })

      expect(chunks).toContain('test')
    })
  })

  describe('createMockStdout', () => {
    it('should create a writable stream', () => {
      const { stream } = createMockStdout()
      expect(stream).toBeDefined()
      expect(stream.writable).toBe(true)
    })

    it('should capture written output', () => {
      const { stream, getOutput } = createMockStdout()

      stream.write('Hello, ')
      stream.write('World!')

      expect(getOutput()).toBe('Hello, World!')
    })

    it('should handle empty output', () => {
      const { getOutput } = createMockStdout()
      expect(getOutput()).toBe('')
    })

    it('should clear output when clear is called', () => {
      const { stream, getOutput, clear } = createMockStdout()

      stream.write('test')
      expect(getOutput()).toBe('test')

      clear()
      expect(getOutput()).toBe('')
    })

    it('should accumulate multiple writes', () => {
      const { stream, getOutput } = createMockStdout()

      for (let i = 0; i < 5; i++) {
        stream.write(`line${i}\n`)
      }

      const output = getOutput()
      expect(output).toContain('line0')
      expect(output).toContain('line4')
    })
  })

  describe('createMockStderr', () => {
    it('should create a writable stream', () => {
      const { stream } = createMockStderr()
      expect(stream).toBeDefined()
      expect(stream.writable).toBe(true)
    })

    it('should capture error output', () => {
      const { stream, getOutput } = createMockStderr()

      stream.write('Error: ')
      stream.write('Something went wrong')

      expect(getOutput()).toBe('Error: Something went wrong')
    })

    it('should clear output when clear is called', () => {
      const { stream, getOutput, clear } = createMockStderr()

      stream.write('error')
      expect(getOutput()).toBe('error')

      clear()
      expect(getOutput()).toBe('')
    })
  })

  describe('simulateInput', () => {
    it('should push inputs to the stream with delays', async () => {
      const stdin = createMockStdin([])
      const inputs = ['a', 'b', 'c']
      const received: string[] = []

      stdin.on('data', (chunk) => {
        received.push(chunk.toString())
      })

      simulateInput(stdin, inputs, 5)

      await new Promise<void>((resolve) => {
        stdin.on('end', () => {
          expect(received).toEqual(inputs)
          resolve()
        })
      })
    })

    it('should end stream after last input', async () => {
      const stdin = createMockStdin([])
      const chunks: string[] = []

      stdin.on('data', (chunk) => {
        chunks.push(chunk.toString())
      })

      simulateInput(stdin, ['test'], 5)

      await new Promise<void>((resolve) => {
        stdin.on('end', () => {
          resolve()
        })
      })

      expect(chunks).toContain('test')
    })

    it('should handle single input', async () => {
      const stdin = createMockStdin([])
      const received: string[] = []

      stdin.on('data', (chunk) => {
        received.push(chunk.toString())
      })

      simulateInput(stdin, ['single'])

      await new Promise<void>((resolve) => {
        stdin.on('end', () => {
          expect(received).toEqual(['single'])
          resolve()
        })
      })
    })
  })
})
