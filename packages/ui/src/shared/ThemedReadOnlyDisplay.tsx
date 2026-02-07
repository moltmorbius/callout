import { Box, type BoxProps } from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/react'
import { useThemeBgColor, useThemeTextColor } from './useThemeColors'
import { boxShadows, borderRadius, getThemeValue } from '../config/themeTokens'

interface ThemedReadOnlyDisplayProps extends Omit<BoxProps, 'bg' | 'color' | 'border' | 'boxShadow'> {
  /** Font size. Defaults to 'xs' */
  size?: 'xs' | 'sm' | 'md'
  /** Whether to use monospace font. Defaults to false */
  monospace?: boolean
  /** Content to display */
  children: React.ReactNode
}

/**
 * Read-only display component with consistent theming across the app.
 * Uses a div instead of textarea so scrollbars can be properly styled.
 * Handles all common styling including background, borders, and scrollbar.
 */
export function ThemedReadOnlyDisplay({
  size = 'xs',
  monospace = false,
  children,
  ...props
}: ThemedReadOnlyDisplayProps) {
  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')
  const boxShadowValue = useColorModeValue(
    getThemeValue(boxShadows.borderInput, 'light'),
    getThemeValue(boxShadows.borderInput, 'dark')
  )

  const fontSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'
  const fontFamily = monospace ? 'monospace' : undefined

  return (
    <Box
      as="div"
      fontSize={fontSize}
      fontFamily={fontFamily}
      bg={inputBg}
      color={inputText}
      border="none"
      borderRadius={borderRadius.none}
      boxShadow={boxShadowValue}
      overflowY="auto"
      whiteSpace="pre-wrap"
      wordBreak="break-word"
      maxH="300px"
      className="custom-scrollbar"
      {...props}
    >
      {children}
    </Box>
  )
}
