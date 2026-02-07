/**
 * Development-only logging utility.
 * Logs are suppressed in production builds via tree-shaking on import.meta.env.DEV.
 */

export function logError(context: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.error(`[Callout] ${context}`, ...args)
  }
}

export function logWarn(context: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(`[Callout] ${context}`, ...args)
  }
}
