/**
 * Logging utility for Callout packages.
 *
 * Logger is configurable — callers pass a `debug` flag to control
 * whether logs are emitted. No environment variable reading.
 */

export interface LoggerOptions {
  /** Whether debug logging is enabled */
  debug?: boolean
  /** Prefix for log messages (default: "Callout") */
  prefix?: string
}

let _debug = false
let _prefix = 'Callout'

/** Configure the logger globally. */
export function configureLogger(options: LoggerOptions): void {
  if (options.debug !== undefined) _debug = options.debug
  if (options.prefix !== undefined) _prefix = options.prefix
}

export function logError(context: string, ...args: unknown[]): void {
  if (_debug) {
    console.error(`[${_prefix}] ${context}`, ...args)
  }
}

export function logWarn(context: string, ...args: unknown[]): void {
  if (_debug) {
    console.warn(`[${_prefix}] ${context}`, ...args)
  }
}

export function logInfo(context: string, ...args: unknown[]): void {
  if (_debug) {
    console.log(`[${_prefix}] ${context}`, ...args)
  }
}
