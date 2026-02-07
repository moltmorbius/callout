import { keyframes } from '@emotion/react'

/**
 * Scan line animation that moves from top to bottom.
 */
export const scanLine = keyframes`
  0%   { top: 0%; }
  100% { top: 100%; }
`

/**
 * Glow pulse animation for decoding state.
 */
export const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(99,179,237,0.15); }
  50%      { box-shadow: 0 0 20px rgba(99,179,237,0.35), 0 0 40px rgba(99,179,237,0.1); }
`

/**
 * Vault pulse animation for encrypted payload section.
 */
export const vaultPulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(236,201,75,0.1); }
  50%      { box-shadow: 0 0 24px rgba(236,201,75,0.3), 0 0 48px rgba(236,201,75,0.08); }
`

/**
 * Text reveal animation for decoded results.
 */
export const textReveal = keyframes`
  0%   { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
`
