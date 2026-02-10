# CLI Testing Guide

This directory contains tests for the Callout CLI application.

## Testing Approach

The CLI uses **Vitest** as the test runner with a comprehensive testing strategy that includes:

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test CLI commands end-to-end by spawning the process
3. **Interactive Component Tests** - Test Ink components with mocked I/O

## Test Infrastructure

### Coverage Requirements

The project enforces **80% minimum coverage** across:
- Lines
- Functions
- Branches
- Statements

Run coverage reports with:
```bash
yarn test:coverage
```

### Helper Utilities

All test helpers are located in `src/__tests__/helpers/`:

#### mockIO.ts
Utilities for mocking stdin/stdout/stderr when testing interactive components:

```typescript
import { createMockStdin, createMockStdout } from './helpers/mockIO'

const stdin = createMockStdin(['user input', '\n'])
const { stream: stdout, getOutput } = createMockStdout()

// ... test your component ...

const output = getOutput()
expect(output).toContain('expected output')
```

#### fixtures.ts
Pre-defined test data for common input types:

```typescript
import { validAddresses, invalidAddresses, validHexData } from './helpers/fixtures'

// Use in tests to verify validation logic
test('should accept valid addresses', () => {
  validAddresses.forEach(addr => {
    expect(isValidAddress(addr)).toBe(true)
  })
})

test('should reject invalid addresses', () => {
  invalidAddresses.forEach(addr => {
    expect(isValidAddress(addr)).toBe(false)
  })
})
```

Available fixtures:
- `validAddresses` / `invalidAddresses` - Ethereum addresses
- `validPublicKeys` / `invalidPublicKeys` - Public keys
- `validHexData` / `invalidHexData` - Hex strings
- `validMessages` / `invalidMessages` - Message strings
- `validPrivateKeys` / `invalidPrivateKeys` - Private keys (test only!)
- `validSignatures` - Signature objects
- `validTransactions` - Transaction objects

#### cliRunner.ts
Utilities for spawning the CLI as a subprocess and capturing output:

```typescript
import { runCLI, runCLISuccess, runCLIFailure } from './helpers/cliRunner'

// Basic usage
const result = await runCLI(['encode', '--help'])
expect(result.exitCode).toBe(0)
expect(result.stdout).toContain('Usage:')

// Assert success
const result = await runCLISuccess(['encode', '--message', 'test'])

// Assert failure
const result = await runCLIFailure(['encode']) // missing required args

// With input simulation
const result = await runCLI(['sign'], { input: 'y\n' })
```

## Running Tests

```bash
# Run all tests once
yarn test

# Run in watch mode
yarn test:watch

# Run with coverage
yarn test:coverage
```

## Writing Tests

### File Naming

Test files should be named `*.test.ts` and placed alongside the source files they test:

```
src/
  components/
    SignFlow.tsx
    SignFlow.test.ts
  commands/
    runner.ts
    runner.test.ts
```

### Test Structure

Follow this structure for consistency:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('ComponentName', () => {
  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = doSomething(input)
      
      // Assert
      expect(result).toBe('expected')
    })

    it('should handle edge case', () => {
      // ...
    })
  })
})
```

### Testing Interactive Components

When testing Ink components, use the render helper from `ink-testing-library`:

```typescript
import { render } from 'ink-testing-library'
import { MyComponent } from './MyComponent'

it('should render component', () => {
  const { lastFrame } = render(<MyComponent />)
  expect(lastFrame()).toContain('expected text')
})
```

### Testing CLI Commands

For end-to-end command tests:

```typescript
import { runCLI, outputContains } from '../helpers/cliRunner'

it('should execute encode command', async () => {
  const result = await runCLI(['encode', '--message', 'test'])
  expect(result.exitCode).toBe(0)
  expect(outputContains(result, 'Encoded message')).toBe(true)
})
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Use fixtures** - Leverage the pre-defined test data in `fixtures.ts`
3. **Mock external dependencies** - Don't make real network calls or interact with real wallets
4. **Test edge cases** - Empty strings, null values, invalid inputs, etc.
5. **Keep tests focused** - One concept per test
6. **Use descriptive test names** - "should X when Y" format
7. **Avoid test interdependence** - Each test should run independently

## Debugging Tests

```bash
# Run a specific test file
yarn test SignFlow.test.ts

# Run tests matching a pattern
yarn test --grep "encode"

# Run with verbose output
yarn test --reporter=verbose
```

## CI/CD

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Main branch pushes

CI will fail if:
- Any test fails
- Coverage drops below 80%
- TypeScript compilation fails
