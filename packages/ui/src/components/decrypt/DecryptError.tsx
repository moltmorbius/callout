import { Box, HStack, Text, Collapse, useColorModeValue } from '@chakra-ui/react'
import { borderRadius } from '../../config/themeTokens'
import { useAccentBorderColor, useThemeBgColor } from '../../shared/useThemeColors'

interface DecryptErrorProps {
  error: string | null
}

/**
 * Error display component for decrypt tab.
 * Shows error messages with warning styling that's highly visible.
 */
export function DecryptError({ error }: DecryptErrorProps) {
  const cardBg = useThemeBgColor('card')
  const redErrorBorderStrong = useAccentBorderColor('red', 'borderStrong')
  const errorBorderShadow = `0 0 0 1px ${redErrorBorderStrong}`

  // Use high contrast text colors that work on both light and dark backgrounds
  const errorTextColor = useColorModeValue('red.800', 'red.200')
  const errorIconColor = useColorModeValue('red.700', 'red.300')

  return (
    <Collapse in={!!error} animateOpacity>
      {error && (
        <Box
          p={4}
          borderRadius={borderRadius.none}
          bg={cardBg}
          border="none"
          boxShadow={errorBorderShadow}
        >
          <HStack spacing={2}>
            <Text fontSize="md" color={errorIconColor} fontWeight="700">⚠️</Text>
            <Text fontSize="sm" color={errorTextColor} fontWeight="600" lineHeight="1.5">
              {error}
            </Text>
          </HStack>
        </Box>
      )}
    </Collapse>
  )
}
