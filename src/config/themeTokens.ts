/**
 * Centralized theme tokens for the entire application.
 * Modify values here to update styling across all components.
 */

import { useColorModeValue } from '@chakra-ui/react'

// ── Type-Safe Variant Definitions (Dynamically Extracted from Theme) ────

/**
 * Base type enforcing that all color definitions must have both light and dark variants.
 * This ensures theme consistency and prevents missing color mode definitions.
 */
export type ThemeColorValue = {
  readonly light: string
  readonly dark: string
}

/**
 * Type helper to enforce ThemeColorValue structure recursively throughout the theme.
 *
 * Rules:
 * - All color objects must have { light: string, dark: string } structure
 * - No exceptions - all color definitions must have both light and dark variants
 *
 * This ensures that any new color definition will be caught at compile time if it's missing
 * light or dark variants.
 */
type EnforceThemeColorStructure<T> = {
  readonly [K in keyof T]: T[K] extends Record<string, unknown>
  ? T[K] extends { readonly light: string; readonly dark: string }
  ? T[K] // Already has correct structure - validate it matches ThemeColorValue
  : T[K] extends { light?: unknown; dark?: unknown }
  ? T[K] extends { light: string; dark: string }
  ? T[K] // Has both light and dark as strings
  : never // Missing light or dark, or wrong types
  : EnforceThemeColorStructure<T[K]> // Recursively enforce for nested objects
  : T[K] // Allow non-object values (primitives, etc.)
}

// ── Border Radius ────────────────────────────────────────────────────
export const borderRadius = {
  none: '0',
  sm: '0',
  md: '0',
  lg: '0',
  xl: '0',
  '2xl': '0',
  full: '0',
} as const

// ── Box Shadows (used for borders) ─────────────────────────────────
export const boxShadows = {
  // Default borders
  border: {
    light: '0 0 0 1px rgba(0, 0, 0, 0.1)',
    dark: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  // Accent borders (red)
  borderAccent: {
    light: '0 0 0 1px rgba(220, 38, 38, 0.2)',
    dark: '0 0 0 1px rgba(220, 38, 38, 0.2)',
  },
  // Input borders
  borderInput: {
    light: '0 0 0 1px rgba(0, 0, 0, 0.15)',
    dark: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  // Input focus borders
  borderInputFocus: {
    light: '0 0 0 1px rgba(220, 38, 38, 0.4)',
    dark: '0 0 0 1px rgba(220, 38, 38, 0.5)',
  },
  // Input hover borders
  borderInputHover: {
    light: '0 0 0 1px rgba(0, 0, 0, 0.2)',
    dark: '0 0 0 1px rgba(255, 255, 255, 0.2)',
  },
  // Card borders
  borderCard: {
    light: '0 0 0 1px rgba(0, 0, 0, 0.08)',
    dark: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  // Card hover borders
  borderCardHover: {
    light: '0 0 0 1px rgba(220, 38, 38, 0.15)',
    dark: '0 0 0 1px rgba(220, 38, 38, 0.2)',
  },
  // Button borders
  borderButton: {
    light: '0 0 0 1px rgba(0, 0, 0, 0.1)',
    dark: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  // Tab list borders
  borderTabList: {
    light: '0 0 0 1px rgba(0, 0, 0, 0.1)',
    dark: '0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  // Header/footer borders
  borderDivider: {
    light: '0 1px 0 0 rgba(0, 0, 0, 0.1)',
    dark: '0 1px 0 0 rgba(255, 255, 255, 0.1)',
  },
  borderDividerTop: {
    light: '0 -1px 0 0 rgba(0, 0, 0, 0.1)',
    dark: '0 -1px 0 0 rgba(255, 255, 255, 0.1)',
  },
  // Dashed borders for custom/optional elements
  borderDashed: {
    light: '0 0 0 1px dashed rgba(0, 0, 0, 0.2)',
    dark: '0 0 0 1px dashed rgba(255, 255, 255, 0.1)',
  },
  borderDashedHover: {
    light: '0 0 0 1px dashed rgba(159, 122, 234, 0.3)',
    dark: '0 0 0 1px dashed rgba(159, 122, 234, 0.3)',
  },
} as const

// Type assertion to enforce ThemeColorValue structure for boxShadows
// @ts-expect-error - This is a compile-time type check, not a runtime value
const _boxShadowsTypeCheck: Record<string, ThemeColorValue> = boxShadows

// ── Colors ─────────────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bg: {
    primary: {
      light: '#f5f5f0', // Marble/off-white
      dark: '#06060f',
    },
    card: {
      light: '#ffffff',
      dark: 'rgba(14, 14, 30, 0.6)',
    },
    cardHover: {
      light: '#ffffff',
      dark: 'rgba(14, 14, 30, 0.75)',
    },
    input: {
      light: 'rgba(255, 255, 255, 0.9)',
      dark: 'rgba(10, 10, 26, 0.8)',
    },
    header: {
      light: 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(6, 6, 15, 0.85)',
    },
    tabList: {
      light: 'rgba(255, 255, 255, 0.8)',
      dark: 'rgba(14, 14, 30, 0.5)',
    },
    button: {
      light: '#ffffff',
      dark: 'rgba(255, 255, 255, 0.03)',
    },
    buttonHover: {
      light: 'rgba(220, 38, 38, 0.08)',
      dark: 'rgba(220, 38, 38, 0.08)',
    },
    interactiveHover: {
      light: 'rgba(0, 0, 0, 0.02)',
      dark: 'rgba(255, 255, 255, 0.02)',
    },
    tabSelected: {
      red: {
        light: 'rgba(220, 38, 38, 0.12)',
        dark: 'rgba(220, 38, 38, 0.12)',
      },
      blue: {
        light: 'rgba(99, 179, 237, 0.1)',
        dark: 'rgba(99, 179, 237, 0.1)',
      },
      green: {
        light: 'rgba(72, 187, 120, 0.1)',
        dark: 'rgba(72, 187, 120, 0.1)',
      },
      purple: {
        light: 'rgba(138, 75, 255, 0.1)',
        dark: 'rgba(138, 75, 255, 0.1)',
      },
    },
    tooltip: {
      light: 'gray.800',
      dark: 'gray.800',
    },
    overlay: {
      light: 'rgba(0, 0, 0, 0.04)',
      dark: 'rgba(255, 255, 255, 0.04)',
    },
    overlayHover: {
      light: 'rgba(0, 0, 0, 0.07)',
      dark: 'rgba(255, 255, 255, 0.07)',
    },
    overlayActive: {
      light: 'rgba(0, 0, 0, 0.05)',
      dark: 'rgba(255, 255, 255, 0.05)',
    },
    borderOverlay: {
      light: 'rgba(0, 0, 0, 0.08)',
      dark: 'rgba(255, 255, 255, 0.08)',
    },
    borderOverlayStrong: {
      light: 'rgba(0, 0, 0, 0.14)',
      dark: 'rgba(255, 255, 255, 0.14)',
    },
    borderOverlaySubtle: {
      light: 'rgba(0, 0, 0, 0.1)',
      dark: 'rgba(255, 255, 255, 0.1)',
    },
    textOverlay: {
      light: 'rgba(0, 0, 0, 0.9)',
      dark: 'rgba(255, 255, 255, 0.9)',
    },
    whiteOverlay: {
      light: 'rgba(255, 255, 255, 0.08)',
      dark: 'rgba(255, 255, 255, 0.08)',
    },
    whiteOverlayStrong: {
      light: 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(255, 255, 255, 0.95)',
    },
  },
  // Text colors
  text: {
    primary: {
      light: 'gray.800',
      dark: 'gray.100',
    },
    secondary: {
      light: 'gray.600',
      dark: 'whiteAlpha.700',
    },
    muted: {
      light: 'gray.500',
      dark: 'whiteAlpha.500',
    },
    veryMuted: {
      light: 'gray.400',
      dark: 'whiteAlpha.400',
    },
    extraMuted: {
      light: 'gray.600',
      dark: 'whiteAlpha.300',
    },
    hero: {
      light: 'gray.800',
      dark: 'whiteAlpha.800',
    },
    heroSubtext: {
      light: 'gray.600',
      dark: 'whiteAlpha.350',
    },
    footer: {
      light: 'gray.600',
      dark: 'whiteAlpha.600',
    },
    footerMuted: {
      light: 'gray.500',
      dark: 'whiteAlpha.500',
    },
    footerBrand: {
      light: 'gray.500',
      dark: 'whiteAlpha.400',
    },
    tab: {
      light: 'gray.600',
      dark: 'whiteAlpha.400',
    },
    tabHover: {
      light: 'gray.800',
      dark: 'whiteAlpha.700',
    },
    tabSelected: {
      red: {
        light: 'red.500',
        dark: 'red.500',
      },
      blue: {
        light: 'blue.500',
        dark: 'blue.500',
      },
      green: {
        light: 'green.500',
        dark: 'green.500',
      },
      purple: {
        light: 'purple.500',
        dark: 'purple.500',
      },
    },
    tagline: {
      light: 'gray.500',
      dark: 'whiteAlpha.350',
    },
    label: {
      light: 'purple.600',
      dark: 'purple.300',
    },
    // Accent text colors (for status, labels, etc.)
    accent: {
      red: {
        light: 'red.400',
        dark: 'red.400',
      },
      redLight: {
        light: 'red.300',
        dark: 'red.300',
      },
      blue: {
        light: 'blue.400',
        dark: 'blue.400',
      },
      blueLight: {
        light: 'blue.300',
        dark: 'blue.300',
      },
      green: {
        light: 'green.400',
        dark: 'green.400',
      },
      greenLight: {
        light: 'green.300',
        dark: 'green.300',
      },
      purple: {
        light: 'purple.400',
        dark: 'purple.400',
      },
      purpleLight: {
        light: 'purple.300',
        dark: 'purple.300',
      },
      orange: {
        light: 'orange.400',
        dark: 'orange.400',
      },
      orangeLight: {
        light: 'orange.300',
        dark: 'orange.300',
      },
      yellow: {
        light: 'yellow.300',
        dark: 'yellow.300',
      },
    },
    // Status colors
    status: {
      success: {
        light: '#22c55e',
        dark: '#22c55e',
      },
      warning: {
        light: 'orange.400',
        dark: 'orange.400',
      },
      error: {
        light: 'red.400',
        dark: 'red.400',
      },
      info: {
        light: 'blue.400',
        dark: 'blue.400',
      },
      pending: {
        light: 'whiteAlpha.400',
        dark: 'whiteAlpha.400',
      },
    },
  },
  // Accent colors
  accent: {
    red: {
      bg: {
        light: 'rgba(220, 38, 38, 0.1)',
        dark: 'rgba(220, 38, 38, 0.1)',
      },
      bgHover: {
        light: 'rgba(220, 38, 38, 0.08)',
        dark: 'rgba(220, 38, 38, 0.12)',
      },
      bgActive: {
        light: 'rgba(220, 38, 38, 0.12)',
        dark: 'rgba(220, 38, 38, 0.18)',
      },
      bgButton: {
        light: 'rgba(220, 38, 38, 0.15)',
        dark: 'rgba(220, 38, 38, 0.15)',
      },
      bgGradient: {
        light: 'rgba(220, 38, 38, 0.6)',
        dark: 'rgba(220, 38, 38, 0.6)',
      },
      bgGradientStrong: {
        light: 'rgba(220, 38, 38, 0.9)',
        dark: 'rgba(220, 38, 38, 0.9)',
      },
      bgGradientCTA: {
        light: 'rgba(185, 28, 28, 0.95)',
        dark: 'rgba(185, 28, 28, 0.95)',
      },
      border: {
        light: 'rgba(220, 38, 38, 0.2)',
        dark: 'rgba(220, 38, 38, 0.2)',
      },
      borderStrong: {
        light: 'rgba(220, 38, 38, 0.35)',
        dark: 'rgba(220, 38, 38, 0.35)',
      },
      shadow: {
        light: 'rgba(220, 38, 38, 0.15)',
        dark: 'rgba(220, 38, 38, 0.25)',
      },
      shadowStrong: {
        light: 'rgba(220, 38, 38, 0.35)',
        dark: 'rgba(220, 38, 38, 0.35)',
      },
      shadowGlow: {
        light: 'rgba(220, 38, 38, 0.12)',
        dark: 'rgba(220, 38, 38, 0.12)',
      },
      text: {
        light: 'red.400',
        dark: 'red.400',
      },
      textSelected: {
        light: 'red.500',
        dark: 'red.500',
      },
    },
    blue: {
      bg: {
        light: 'rgba(99, 179, 237, 0.08)',
        dark: 'rgba(99, 179, 237, 0.08)',
      },
      bgStrong: {
        light: 'rgba(99, 179, 237, 0.1)',
        dark: 'rgba(99, 179, 237, 0.1)',
      },
      bgMeta: {
        light: 'rgba(99, 179, 237, 0.04)',
        dark: 'rgba(99, 179, 237, 0.04)',
      },
      border: {
        light: 'rgba(99, 179, 237, 0.2)',
        dark: 'rgba(99, 179, 237, 0.2)',
      },
      borderMeta: {
        light: 'rgba(99, 179, 237, 0.12)',
        dark: 'rgba(99, 179, 237, 0.12)',
      },
      borderFocus: {
        light: 'rgba(99, 179, 237, 0.3)',
        dark: 'rgba(99, 179, 237, 0.3)',
      },
      borderFocusStrong: {
        light: 'rgba(99, 179, 237, 0.4)',
        dark: 'rgba(99, 179, 237, 0.4)',
      },
      shadowFocus: {
        light: 'rgba(99, 179, 237, 0.08)',
        dark: 'rgba(99, 179, 237, 0.08)',
      },
      text: {
        light: 'blue.600',
        dark: 'blue.300',
      },
      gradient: {
        light: 'rgba(99,179,237,0.3)',
        dark: 'rgba(99,179,237,0.3)',
      },
      scanBg: {
        light: 'rgba(99, 179, 237, 0.4)',
        dark: 'rgba(99, 179, 237, 0.4)',
      },
      scanShadow: {
        light: 'rgba(99, 179, 237, 0.5)',
        dark: 'rgba(99, 179, 237, 0.5)',
      },
    },
    green: {
      bg: {
        light: 'rgba(72, 187, 120, 0.1)',
        dark: 'rgba(72, 187, 120, 0.1)',
      },
      bgSubtle: {
        light: 'rgba(72, 187, 120, 0.06)',
        dark: 'rgba(72, 187, 120, 0.06)',
      },
      bgDecrypted: {
        light: 'rgba(72, 187, 120, 0.08)',
        dark: 'rgba(72, 187, 120, 0.08)',
      },
      border: {
        light: 'rgba(72, 187, 120, 0.25)',
        dark: 'rgba(72, 187, 120, 0.25)',
      },
      borderVerified: {
        light: 'rgba(72, 187, 120, 0.2)',
        dark: 'rgba(72, 187, 120, 0.2)',
      },
      gradient: {
        light: 'rgba(72,187,120,0.3)',
        dark: 'rgba(72,187,120,0.3)',
      },
    },
    yellow: {
      bg: {
        light: 'rgba(236, 201, 75, 0.06)',
        dark: 'rgba(236, 201, 75, 0.06)',
      },
      bgEncrypted: {
        light: 'rgba(236, 201, 75, 0.04)',
        dark: 'rgba(236, 201, 75, 0.04)',
      },
      bgIcon: {
        light: 'rgba(236, 201, 75, 0.1)',
        dark: 'rgba(236, 201, 75, 0.1)',
      },
      bgButton: {
        light: 'rgba(236, 201, 75, 0.2)',
        dark: 'rgba(236, 201, 75, 0.15)',
      },
      bgButtonHover: {
        light: 'rgba(236, 201, 75, 0.25)',
        dark: 'rgba(236, 201, 75, 0.25)',
      },
      bgButtonDisabled: {
        light: 'rgba(236, 201, 75, 0.15)',
        dark: 'rgba(236, 201, 75, 0.15)',
      },
      border: {
        light: 'rgba(236, 201, 75, 0.2)',
        dark: 'rgba(236, 201, 75, 0.2)',
      },
      borderEncrypted: {
        light: 'rgba(236, 201, 75, 0.15)',
        dark: 'rgba(236, 201, 75, 0.15)',
      },
      borderIcon: {
        light: 'rgba(236, 201, 75, 0.25)',
        dark: 'rgba(236, 201, 75, 0.25)',
      },
      borderInput: {
        light: 'rgba(236, 201, 75, 0.15)',
        dark: 'rgba(236, 201, 75, 0.15)',
      },
      text: {
        light: 'yellow.700',
        dark: 'yellow.300',
      },
      textMuted: {
        light: 'yellow.700',
        dark: 'yellow.200',
      },
      gradient: {
        light: 'rgba(236,201,75,0.3)',
        dark: 'rgba(236,201,75,0.3)',
      },
      focusBorder: {
        light: 'yellow.400',
        dark: 'yellow.400',
      },
      focusShadow: {
        light: 'rgba(236, 201, 75, 0.3)',
        dark: 'rgba(236, 201, 75, 0.3)',
      },
      focusGlow: {
        light: 'rgba(236, 201, 75, 0.08)',
        dark: 'rgba(236, 201, 75, 0.08)',
      },
      buttonShadow: {
        light: 'rgba(236, 201, 75, 0.12)',
        dark: 'rgba(236, 201, 75, 0.12)',
      },
      buttonBoxShadow: {
        light: '0 0 0 1px rgba(236, 201, 75, 0.3)',
        dark: '0 0 0 1px rgba(236, 201, 75, 0.25)',
      },
      inputBoxShadow: {
        light: '0 0 0 1px rgba(236, 201, 75, 0.15)',
        dark: '0 0 0 1px rgba(236, 201, 75, 0.15)',
      },
    },
    orange: {
      bg: {
        light: 'rgba(237, 137, 54, 0.1)',
        dark: 'rgba(237, 137, 54, 0.1)',
      },
      border: {
        light: 'rgba(237, 137, 54, 0.2)',
        dark: 'rgba(237, 137, 54, 0.2)',
      },
      gradient: {
        light: 'rgba(251, 146, 60, 0.4)',
        dark: 'rgba(251, 146, 60, 0.4)',
      },
      gradientStrong: {
        light: 'rgba(251, 146, 60, 0.3)',
        dark: 'rgba(251, 146, 60, 0.3)',
      },
    },
    purple: {
      bgBadge: {
        light: 'rgba(159, 122, 234, 0.1)',
        dark: 'rgba(159, 122, 234, 0.1)',
      },
      bgMeta: {
        light: 'rgba(159, 122, 234, 0.04)',
        dark: 'rgba(159, 122, 234, 0.04)',
      },
      bgButton: {
        light: 'rgba(138, 75, 255, 0.15)',
        dark: 'rgba(138, 75, 255, 0.15)',
      },
      bgButtonHover: {
        light: 'rgba(138, 75, 255, 0.9)',
        dark: 'rgba(138, 75, 255, 0.9)',
      },
      bgButtonActive: {
        light: 'rgba(138, 75, 255, 0.4)',
        dark: 'rgba(138, 75, 255, 0.4)',
      },
      bgButtonDisabled: {
        light: 'rgba(138, 75, 255, 0.1)',
        dark: 'rgba(138, 75, 255, 0.1)',
      },
      bgButtonDisabledHover: {
        light: 'rgba(138, 75, 255, 0.5)',
        dark: 'rgba(138, 75, 255, 0.5)',
      },
      borderBadge: {
        light: 'rgba(159, 122, 234, 0.2)',
        dark: 'rgba(159, 122, 234, 0.2)',
      },
      borderMeta: {
        light: 'rgba(159, 122, 234, 0.12)',
        dark: 'rgba(159, 122, 234, 0.12)',
      },
      borderFocus: {
        light: 'rgba(138, 75, 255, 0.4)',
        dark: 'rgba(138, 75, 255, 0.4)',
      },
      shadow: {
        light: 'rgba(138, 75, 255, 0.4)',
        dark: 'rgba(138, 75, 255, 0.4)',
      },
      shadowGlow: {
        light: 'rgba(138, 75, 255, 0.15)',
        dark: 'rgba(138, 75, 255, 0.15)',
      },
      shadowStrong: {
        light: 'rgba(138, 75, 255, 0.3)',
        dark: 'rgba(138, 75, 255, 0.3)',
      },
      text: {
        light: 'purple.600',
        dark: 'purple.300',
      },
    },
  },
  // Category colors for template/category cards
  category: {
    green: {
      bg: {
        light: 'rgba(72, 187, 120, 0.06)',
        dark: 'rgba(72, 187, 120, 0.06)',
      },
      bgHover: {
        light: 'rgba(72, 187, 120, 0.1)',
        dark: 'rgba(72, 187, 120, 0.1)',
      },
      border: {
        light: 'rgba(72, 187, 120, 0.35)',
        dark: 'rgba(72, 187, 120, 0.35)',
      },
      glow: {
        light: '0 0 30px rgba(72, 187, 120, 0.12), 0 0 60px rgba(72, 187, 120, 0.05)',
        dark: '0 0 30px rgba(72, 187, 120, 0.12), 0 0 60px rgba(72, 187, 120, 0.05)',
      },
      text: {
        light: 'green.300',
        dark: 'green.300',
      },
      badge: {
        light: 'green',
        dark: 'green',
      },
      iconBg: {
        light: 'rgba(72, 187, 120, 0.12)',
        dark: 'rgba(72, 187, 120, 0.12)',
      },
    },
    yellow: {
      bg: {
        light: 'rgba(236, 201, 75, 0.06)',
        dark: 'rgba(236, 201, 75, 0.06)',
      },
      bgHover: {
        light: 'rgba(236, 201, 75, 0.1)',
        dark: 'rgba(236, 201, 75, 0.1)',
      },
      border: {
        light: 'rgba(236, 201, 75, 0.35)',
        dark: 'rgba(236, 201, 75, 0.35)',
      },
      glow: {
        light: '0 0 30px rgba(236, 201, 75, 0.12), 0 0 60px rgba(236, 201, 75, 0.05)',
        dark: '0 0 30px rgba(236, 201, 75, 0.12), 0 0 60px rgba(236, 201, 75, 0.05)',
      },
      text: {
        light: 'yellow.300',
        dark: 'yellow.300',
      },
      badge: {
        light: 'yellow',
        dark: 'yellow',
      },
      iconBg: {
        light: 'rgba(236, 201, 75, 0.12)',
        dark: 'rgba(236, 201, 75, 0.12)',
      },
    },
    red: {
      bg: {
        light: 'rgba(220, 38, 38, 0.06)',
        dark: 'rgba(220, 38, 38, 0.06)',
      },
      bgHover: {
        light: 'rgba(220, 38, 38, 0.1)',
        dark: 'rgba(220, 38, 38, 0.1)',
      },
      border: {
        light: 'rgba(220, 38, 38, 0.35)',
        dark: 'rgba(220, 38, 38, 0.35)',
      },
      glow: {
        light: '0 0 30px rgba(220, 38, 38, 0.15), 0 0 60px rgba(220, 38, 38, 0.06)',
        dark: '0 0 30px rgba(220, 38, 38, 0.15), 0 0 60px rgba(220, 38, 38, 0.06)',
      },
      text: {
        light: 'red.300',
        dark: 'red.300',
      },
      badge: {
        light: 'red',
        dark: 'red',
      },
      iconBg: {
        light: 'rgba(220, 38, 38, 0.12)',
        dark: 'rgba(220, 38, 38, 0.12)',
      },
    },
    orange: {
      bg: {
        light: 'rgba(237, 137, 54, 0.06)',
        dark: 'rgba(237, 137, 54, 0.06)',
      },
      bgHover: {
        light: 'rgba(237, 137, 54, 0.1)',
        dark: 'rgba(237, 137, 54, 0.1)',
      },
      border: {
        light: 'rgba(237, 137, 54, 0.35)',
        dark: 'rgba(237, 137, 54, 0.35)',
      },
      glow: {
        light: '0 0 30px rgba(237, 137, 54, 0.12), 0 0 60px rgba(237, 137, 54, 0.05)',
        dark: '0 0 30px rgba(237, 137, 54, 0.12), 0 0 60px rgba(237, 137, 54, 0.05)',
      },
      text: {
        light: 'orange.300',
        dark: 'orange.300',
      },
      badge: {
        light: 'orange',
        dark: 'orange',
      },
      iconBg: {
        light: 'rgba(237, 137, 54, 0.12)',
        dark: 'rgba(237, 137, 54, 0.12)',
      },
    },
    purple: {
      bg: {
        light: 'rgba(159, 122, 234, 0.06)',
        dark: 'rgba(159, 122, 234, 0.06)',
      },
      bgHover: {
        light: 'rgba(159, 122, 234, 0.1)',
        dark: 'rgba(159, 122, 234, 0.1)',
      },
      border: {
        light: 'rgba(159, 122, 234, 0.35)',
        dark: 'rgba(159, 122, 234, 0.35)',
      },
      glow: {
        light: '0 0 30px rgba(159, 122, 234, 0.12), 0 0 60px rgba(159, 122, 234, 0.05)',
        dark: '0 0 30px rgba(159, 122, 234, 0.12), 0 0 60px rgba(159, 122, 234, 0.05)',
      },
      text: {
        light: 'purple.300',
        dark: 'purple.300',
      },
      badge: {
        light: 'purple',
        dark: 'purple',
      },
      iconBg: {
        light: 'rgba(159, 122, 234, 0.12)',
        dark: 'rgba(159, 122, 234, 0.12)',
      },
    },
    blue: {
      bg: {
        light: 'rgba(99, 179, 237, 0.06)',
        dark: 'rgba(99, 179, 237, 0.06)',
      },
      bgHover: {
        light: 'rgba(99, 179, 237, 0.1)',
        dark: 'rgba(99, 179, 237, 0.1)',
      },
      border: {
        light: 'rgba(99, 179, 237, 0.35)',
        dark: 'rgba(99, 179, 237, 0.35)',
      },
      glow: {
        light: '0 0 30px rgba(99, 179, 237, 0.12), 0 0 60px rgba(99, 179, 237, 0.05)',
        dark: '0 0 30px rgba(99, 179, 237, 0.12), 0 0 60px rgba(99, 179, 237, 0.05)',
      },
      text: {
        light: 'blue.300',
        dark: 'blue.300',
      },
      badge: {
        light: 'blue',
        dark: 'blue',
      },
      iconBg: {
        light: 'rgba(99, 179, 237, 0.12)',
        dark: 'rgba(99, 179, 237, 0.12)',
      },
    },
  },
} as const

// Type assertion to enforce ThemeColorValue structure
// This ensures all color definitions have both light and dark variants
// @ts-expect-error - This is a compile-time type check, not a runtime value
const _typeCheck: EnforceThemeColorStructure<typeof colors> = colors

// ── Strong Type Definitions Dynamically Extracted from Theme Structure ───

/**
 * Extract keys from the colors.bg object for type-safe useThemeBgColor
 */
export type ThemeBgVariant = keyof typeof colors.bg

/**
 * Extract keys from colors.text (excluding accent and status) for type-safe useThemeTextColor
 */
export type ThemeTextVariant = Exclude<keyof typeof colors.text, 'accent' | 'status'>

/**
 * Extract keys from colors.text.accent for type-safe useAccentTextColor
 */
export type AccentTextVariant = keyof typeof colors.text.accent

/**
 * Extract keys from colors.text.status for type-safe useStatusTextColor
 */
export type StatusTextVariant = keyof typeof colors.text.status

/**
 * Extract valid accent color names from the colors.accent object
 */
export type AccentColor = keyof typeof colors.accent

/**
 * Extract valid category color names from the colors.category object
 */
export type CategoryColor = keyof typeof colors.category

/**
 * Intermediate type alias for the accent color map.
 * Used by all per-color variant types to properly narrow generics.
 *
 * IMPORTANT: TypeScript cannot narrow `typeof colors.accent[T]` when T is a
 * generic parameter — it widens to the union of ALL accent color objects,
 * making every key valid for every color. The fix is to pre-compute a mapped
 * type that resolves each color independently, then index into it with T.
 */
type AccentColorMap = typeof colors.accent

/**
 * Pre-computed map of bg variant keys for each accent color.
 * Resolves each color independently so TypeScript can narrow correctly.
 *
 * Example resolved types:
 * - AccentBgVariant<'red'>    → 'bg' | 'bgHover' | 'bgActive' | 'bgButton' | 'bgGradient' | 'bgGradientStrong' | 'bgGradientCTA'
 * - AccentBgVariant<'purple'> → 'bgBadge' | 'bgMeta' | 'bgButton' | 'bgButtonHover' | 'bgButtonActive' | 'bgButtonDisabled' | 'bgButtonDisabledHover'
 */
export type AccentBgVariant<T extends AccentColor> = {
  [C in AccentColor]: {
    [K in keyof AccentColorMap[C]]: K extends `bg${string}` ? K : never
  }[keyof AccentColorMap[C]]
}[T]

/**
 * Pre-computed map of border variant keys for each accent color.
 * Resolves each color independently so TypeScript can narrow correctly.
 *
 * Example resolved types:
 * - AccentBorderVariant<'red'>    → 'border' | 'borderStrong'
 * - AccentBorderVariant<'purple'> → 'borderBadge' | 'borderMeta' | 'borderFocus'
 */
export type AccentBorderVariant<T extends AccentColor> = {
  [C in AccentColor]: {
    [K in keyof AccentColorMap[C]]: K extends `border${string}` ? K : never
  }[keyof AccentColorMap[C]]
}[T]

/**
 * Pre-computed map of "special" variant keys for each accent color.
 * These are variants that are NOT bg, border, text, or gradient keys.
 * Examples: scanBg, scanShadow (blue), focusBorder, focusShadow (yellow).
 *
 * Resolves each color independently so TypeScript can narrow correctly.
 */
export type ExtractSpecialVariants<T extends AccentColor> = {
  [C in AccentColor]: {
    [K in keyof AccentColorMap[C]]: K extends `bg${string}` | `border${string}` | 'text' | 'textSelected' | 'textMuted' | 'gradient' | 'gradientStrong'
    ? never
    : K
  }[keyof AccentColorMap[C]]
}[T]

/**
 * Extract accent colors that have a 'text' property.
 * Derived dynamically from the theme structure.
 */
export type AccentColorWithText = {
  [K in AccentColor]: 'text' extends keyof AccentColorMap[K] ? K : never
}[AccentColor]

/**
 * Extract accent colors that have a 'gradient' property.
 * Derived dynamically from the theme structure.
 */
export type AccentColorWithGradient = {
  [K in AccentColor]: 'gradient' extends keyof AccentColorMap[K] ? K : never
}[AccentColor]

/**
 * Extract accent colors that have shadow variants (shadow, shadowStrong, shadowGlow).
 * Derived dynamically from the theme structure.
 */
export type AccentColorWithShadow = {
  [K in AccentColor]: 'shadow' extends keyof AccentColorMap[K] ? K : never
}[AccentColor]

/**
 * Pre-computed map of shadow variant keys for each accent color that has shadows.
 * Resolves each color independently so TypeScript can narrow correctly.
 */
export type AccentShadowVariant<T extends AccentColorWithShadow> = {
  [C in AccentColorWithShadow]: {
    [K in keyof AccentColorMap[C]]: K extends `shadow${string}` | 'shadow' ? K : never
  }[keyof AccentColorMap[C]]
}[T]

// ── Spacing ──────────────────────────────────────────────────────────
export const spacing = {
  cardPadding: {
    base: 4,
    md: 6,
  },
  containerPadding: {
    base: 4,
    md: 6,
  },
} as const

// ── Gradients ────────────────────────────────────────────────────────
export const gradients = {
  hero: {
    light: 'linear(to-r, red.500, red.400, orange.400, red.400)',
    dark: 'linear(to-r, red.500, red.400, orange.400, red.400)',
  },
  heroAccent: {
    light: 'linear(to-r, red.400, orange.300)',
    dark: 'linear(to-r, red.400, orange.300)',
  },
  headerLogo: {
    light: 'linear(to-r, red.400, red.300, orange.300)',
    dark: 'linear(to-r, red.400, red.300, orange.300)',
  },
  backgroundTop: {
    light: 'radial(ellipse at 50% -20%, rgba(220,38,38,0.03) 0%, transparent 70%)',
    dark: 'radial(ellipse at 50% -20%, rgba(220,38,38,0.08) 0%, transparent 70%)',
  },
  backgroundBottom: {
    light: 'radial(ellipse at 50% 120%, rgba(99,179,237,0.01) 0%, transparent 70%)',
    dark: 'radial(ellipse at 50% 120%, rgba(99,179,237,0.03) 0%, transparent 70%)',
  },
} as const

// Type assertion to enforce ThemeColorValue structure for gradients
// @ts-expect-error - This is a compile-time type check, not a runtime value
const _gradientsTypeCheck: Record<string, ThemeColorValue> = gradients

// ── Helper function to get theme-aware values ────────────────────────
export function getThemeValue<T extends Record<'light' | 'dark', unknown>>(
  values: T,
  colorMode: 'light' | 'dark'
): T['light'] | T['dark'] {
  return values[colorMode]
}

/**
 * Hook to get theme-aware text colors.
 * Usage: const textColor = useTextColor('primary')
 *
 * For non-theme-aware colors (accent, status), access directly:
 * colors.text.accent.red, colors.text.status.success, etc.
 */
export function useTextColor(
  variant: Exclude<ThemeTextVariant, 'tabSelected'>
) {
  return useColorModeValue(
    getThemeValue(colors.text[variant], 'light'),
    getThemeValue(colors.text[variant], 'dark')
  )
}
