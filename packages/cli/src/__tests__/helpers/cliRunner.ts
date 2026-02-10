/**
 * Helper functions to spawn CLI process and capture output
 */

import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'

export interface CLIResult {
  stdout: string
  stderr: string
  exitCode: number | null
  signal: NodeJS.Signals | null
}

export interface CLIOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  timeout?: number
  input?: string
}

/**
 * Spawns the CLI process with the given arguments and captures output
 * @param args - Command line arguments to pass to the CLI
 * @param options - Options for running the CLI
 * @returns Promise that resolves with the output and exit code
 */
export async function runCLI(
  args: string[] = [],
  options: CLIOptions = {}
): Promise<CLIResult> {
  return new Promise((resolve, reject) => {
    const {
      cwd = process.cwd(),
      env = process.env,
      timeout = 5000,
      input,
    } = options

    // Path to the CLI entry point
    const cliPath = join(cwd, 'dist', 'index.js')

    const child: ChildProcess = spawn('node', [cliPath, ...args], {
      cwd,
      env: { ...env, FORCE_COLOR: '0' }, // Disable color output for easier testing
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let timeoutId: NodeJS.Timeout | null = null

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })
    }

    // Handle timeout
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM')
        reject(new Error(`CLI process timed out after ${timeout}ms`))
      }, timeout)
    }

    // Send input if provided
    if (input && child.stdin) {
      child.stdin.write(input)
      child.stdin.end()
    }

    child.on('close', (code, signal) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      resolve({
        stdout,
        stderr,
        exitCode: code,
        signal,
      })
    })

    child.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      reject(error)
    })
  })
}

/**
 * Helper to run the CLI and assert successful execution
 * @param args - Command line arguments
 * @param options - CLI options
 * @returns The CLI result
 * @throws If the CLI exits with non-zero code
 */
export async function runCLISuccess(
  args: string[] = [],
  options: CLIOptions = {}
): Promise<CLIResult> {
  const result = await runCLI(args, options)

  if (result.exitCode !== 0) {
    throw new Error(
      `CLI exited with code ${result.exitCode}\nStdout: ${result.stdout}\nStderr: ${result.stderr}`
    )
  }

  return result
}

/**
 * Helper to run the CLI and assert failure (non-zero exit)
 * @param args - Command line arguments
 * @param options - CLI options
 * @returns The CLI result
 * @throws If the CLI exits with zero code (success)
 */
export async function runCLIFailure(
  args: string[] = [],
  options: CLIOptions = {}
): Promise<CLIResult> {
  const result = await runCLI(args, options)

  if (result.exitCode === 0) {
    throw new Error(
      `Expected CLI to fail, but it succeeded\nStdout: ${result.stdout}`
    )
  }

  return result
}

/**
 * Helper to extract JSON output from CLI stdout
 * @param stdout - The stdout string from CLI execution
 * @returns Parsed JSON object, or null if not found
 */
export function extractJSON(stdout: string): unknown {
  // Try to find JSON in the output
  const jsonMatch = stdout.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return null
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

/**
 * Helper to check if CLI output contains a specific string
 * @param result - The CLI result
 * @param searchString - String to search for
 * @param inStderr - Whether to search stderr instead of stdout (default: false)
 * @returns True if the string is found
 */
export function outputContains(
  result: CLIResult,
  searchString: string,
  inStderr = false
): boolean {
  const output = inStderr ? result.stderr : result.stdout
  return output.includes(searchString)
}
