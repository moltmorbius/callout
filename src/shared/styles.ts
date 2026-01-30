import type { BoxProps } from '@chakra-ui/react'

/**
 * Shared card style used across sections.
 * Dark glass-morphism card with subtle border.
 */
export const cardStyle: BoxProps = {
  bg: 'rgba(14, 14, 30, 0.6)',
  borderRadius: '2xl',
  border: '1px solid',
  borderColor: 'whiteAlpha.50',
  p: { base: 5, md: 6 },
}
