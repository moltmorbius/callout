import { useColorModeValue } from '@chakra-ui/react'
import { colors, getThemeValue } from '../config/themeTokens'
import type { SystemStyleObject } from '@chakra-ui/react'

/**
 * Custom scrollbar styles that adapt to light/dark mode.
 * Can be applied to any scrollable element using Chakra's sx prop.
 *
 * @example
 * <Box sx={useScrollbarStyles()}>
 *   Scrollable content
 * </Box>
 */
export function useScrollbarStyles(): SystemStyleObject {
  const trackBg = useColorModeValue(
    getThemeValue(colors.bg.primary, 'light'),
    getThemeValue(colors.bg.primary, 'dark')
  )
  const thumbBg = useColorModeValue(
    'rgba(0, 0, 0, 0.2)',
    'rgba(255, 255, 255, 0.1)'
  )
  const thumbHoverBg = useColorModeValue(
    'rgba(0, 0, 0, 0.3)',
    'rgba(255, 255, 255, 0.15)'
  )
  const thumbActiveBg = useColorModeValue(
    'rgba(0, 0, 0, 0.4)',
    'rgba(255, 255, 255, 0.2)'
  )

  const scrollbarColorValue = `${thumbBg} ${trackBg}`
  const borderValue = `2px solid ${trackBg}`

  return {
    // Firefox scrollbar
    scrollbarWidth: 'thin',
    scrollbarGutter: 'stable',
    scrollbarColor: scrollbarColorValue,

    // Chrome/Safari/Edge scrollbar - don't set border-radius, let it default to square
    '&::-webkit-scrollbar': {
      display: 'block',
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: trackBg,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: thumbBg,
      '&:hover': {
        backgroundColor: thumbHoverBg,
      },
      '&:active': {
        backgroundColor: thumbActiveBg,
      },
    },
  } as SystemStyleObject
}

/**
 * Static scrollbar styles object (for use without hooks).
 * Use this when you need scrollbar styles in a non-component context
 * or when you want to combine with other sx styles.
 *
 * Note: This uses default dark mode colors. For theme-aware styles,
 * use useScrollbarStyles() hook instead.
 */
export const scrollbarStyles: SystemStyleObject = {
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.1) rgba(6, 6, 15, 1)',
  '&::-webkit-scrollbar': {
    display: 'block',
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(6, 6, 15, 1)',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    '&:active': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
}
