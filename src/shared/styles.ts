import type { BoxProps } from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/react'
import { colors, boxShadows, spacing, borderRadius, getThemeValue } from '../config/themeTokens'

/**
 * Shared card style used across sections.
 * Supports both container mode (with padding) and content mode (no padding).
 * Uses box-shadow for borders to prevent overflow issues on full-width elements.
 * All styling values come from centralized themeTokens.
 *
 * @param isContainer - If true, includes padding. If false, acts as content wrapper.
 */
export function useCardStyle(isContainer = true): BoxProps {
  const bg = useColorModeValue(
    getThemeValue(colors.bg.card, 'light'),
    getThemeValue(colors.bg.card, 'dark')
  )
  const borderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )

  return {
    bg,
    borderRadius: borderRadius.none,
    border: 'none',
    boxShadow: borderShadow,
    ...(isContainer && { p: { base: spacing.cardPadding.base, md: spacing.cardPadding.md } }),
  }
}

/**
 * Legacy card style for backward compatibility.
 * Use useCardStyle hook instead for theme-aware styling.
 */
export const cardStyle: BoxProps = {
  bg: getThemeValue(colors.bg.card, 'dark'),
  borderRadius: borderRadius.none,
  border: 'none',
  boxShadow: getThemeValue(boxShadows.borderCard, 'dark'),
  p: { base: spacing.cardPadding.base, md: spacing.cardPadding.md },
}
