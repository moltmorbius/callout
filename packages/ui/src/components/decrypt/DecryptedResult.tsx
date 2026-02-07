import { Box, HStack, Text, Code, Collapse } from '@chakra-ui/react'
import { borderRadius } from '../../config/themeTokens'
import { useAccentBorderColor, useThemeBgColor, useAccentTextColor } from '../../shared/useThemeColors'
import { textReveal } from './animations'

interface DecryptedResultProps {
  decryptedMessage: string | null
}

/**
 * Decrypted result display component.
 * Shows the successfully decrypted message content.
 */
export function DecryptedResult({ decryptedMessage }: DecryptedResultProps) {
  const greenDecryptedBorder = useAccentBorderColor('green', 'border')
  const greenBorderShadow = `0 0 0 1px ${greenDecryptedBorder}`
  const cardBg = useThemeBgColor('card')
  const greenText = useAccentTextColor('greenLight')

  return (
    <Collapse in={!!decryptedMessage} animateOpacity>
      {decryptedMessage && (
        <Box
          py={1.5}
          px={0}
          bg={cardBg}
          borderRadius={borderRadius.none}
          border="none"
          boxShadow={greenBorderShadow}
          animation={`${textReveal} 0.1s ease-out`}
        >
          <HStack spacing={2} mb={1} px={4}>
            <Text fontSize="sm">🔓</Text>
            <Text fontSize="xs" color={greenText} fontWeight="800" letterSpacing="0.08em" textTransform="uppercase">
              Unlocked
            </Text>
          </HStack>
          <Code
            bg="transparent"
            color={greenText}
            whiteSpace="pre-wrap"
            display="block"
            fontSize="sm"
            fontFamily="mono"
            lineHeight="1.7"
            px={4}
          >
            {decryptedMessage}
          </Code>
        </Box>
      )}
    </Collapse>
  )
}
