/**
 * Tests for CLI runner helpers
 */

import { describe, it, expect } from 'vitest'
import {
  runCLI,
  runCLISuccess,
  runCLIFailure,
  extractJSON,
  outputContains,
  type CLIResult,
} from './cliRunner'

describe('cliRunner', () => {
  describe('extractJSON', () => {
    it('should extract JSON from output', () => {
      const stdout = 'Some text\n{"key": "value", "num": 42}\nMore text'
      const result = extractJSON(stdout)

      expect(result).toEqual({ key: 'value', num: 42 })
    })

    it('should return null if no JSON found', () => {
      const stdout = 'Just plain text without JSON'
      const result = extractJSON(stdout)

      expect(result).toBeNull()
    })

    it('should return null for invalid JSON', () => {
      const stdout = 'Some text\n{invalid json}\nMore text'
      const result = extractJSON(stdout)

      expect(result).toBeNull()
    })

    it('should extract nested JSON', () => {
      const stdout =
        'Output: {"user": {"name": "test", "id": 123}, "active": true}'
      const result = extractJSON(stdout)

      expect(result).toEqual({
        user: { name: 'test', id: 123 },
        active: true,
      })
    })

    it('should handle JSON with arrays', () => {
      const stdout = '{"items": [1, 2, 3], "count": 3}'
      const result = extractJSON(stdout)

      expect(result).toEqual({ items: [1, 2, 3], count: 3 })
    })

    it('should extract JSON from mixed output', () => {
      const stdout = 'Some text\n{"data": "value"}\nMore text'
      const result = extractJSON(stdout)

      expect(result).toEqual({ data: 'value' })
    })
  })

  describe('outputContains', () => {
    const mockResult: CLIResult = {
      stdout: 'This is stdout output\nWith multiple lines',
      stderr: 'This is stderr output\nWith errors',
      exitCode: 0,
      signal: null,
    }

    it('should find string in stdout', () => {
      expect(outputContains(mockResult, 'stdout output')).toBe(true)
    })

    it('should find string in stderr when specified', () => {
      expect(outputContains(mockResult, 'stderr output', true)).toBe(true)
    })

    it('should return false if string not found in stdout', () => {
      expect(outputContains(mockResult, 'not present')).toBe(false)
    })

    it('should return false if string not found in stderr', () => {
      expect(outputContains(mockResult, 'not present', true)).toBe(false)
    })

    it('should handle multi-line search', () => {
      expect(outputContains(mockResult, 'multiple lines')).toBe(true)
    })

    it('should be case-sensitive', () => {
      expect(outputContains(mockResult, 'STDOUT OUTPUT')).toBe(false)
    })

    it('should handle empty string search', () => {
      expect(outputContains(mockResult, '')).toBe(true)
    })
  })

  // Note: Actual CLI execution tests would require the CLI to be built
  // These are more like integration tests and should be run separately
  describe('runCLI (integration)', () => {
    it('should be a function', () => {
      expect(typeof runCLI).toBe('function')
    })
  })

  describe('runCLISuccess (integration)', () => {
    it('should be a function', () => {
      expect(typeof runCLISuccess).toBe('function')
    })

    it('should be defined', async () => {
      // This would need a built CLI to test properly
      // For now, we just verify the function exists
      expect(runCLISuccess).toBeDefined()
    })
  })

  describe('runCLIFailure (integration)', () => {
    it('should be a function', () => {
      expect(typeof runCLIFailure).toBe('function')
    })

    it('should be defined', async () => {
      // This would need a built CLI to test properly
      // For now, we just verify the function exists
      expect(runCLIFailure).toBeDefined()
    })
  })
})
