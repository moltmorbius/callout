import { Box, HStack, Text } from '@chakra-ui/react'
import { borderRadius } from '../../config/themeTokens'
import { useThemeTextColor, useAccentBorderColor, useThemeBgColor, useAccentTextColor } from '../../shared/useThemeColors'
import { type Address } from 'viem'

interface SignatureVerificationProps {
  recoveredAddress: Address
}

/**
 * Signature verification display component.
 * Shows the recovered address from a signed message.
 */
export function SignatureVerification({ recoveredAddress }: SignatureVerificationProps) {
  const cardBg = useThemeBgColor('card')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const greenTextLight = useAccentTextColor('greenLight')

  const greenVerifiedBorder = useAccentBorderColor('green', 'borderVerified')
  const greenBorderShadow = `0 0 0 1px ${greenVerifiedBorder}`

  return (
    <Box
      py={1.5}
      px={0}
      bg={cardBg}
      borderRadius={borderRadius.none}
      border="none"
      boxShadow={greenBorderShadow}
    >
      <Box px={4}>
      <HStack spacing={2} mb={1.5}>
        <Text fontSize="sm">✓</Text>
        <Text
          fontSize="xs"
          fontWeight="800"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color={greenTextLight}
        >
          Signature Verified
        </Text>
      </HStack>
        <HStack spacing={1.5}>
          <Text fontSize="10px" color={textVeryMuted} fontWeight="700" textTransform="uppercase">
            Signed by
          </Text>
          <Text fontSize="xs" fontFamily="mono" color={greenTextLight} fontWeight="600">
            {recoveredAddress}
          </Text>
        </HStack>
      </Box>
    </Box>
  )
}
