import { Box, Flex, Text } from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/react'
import { boxShadows, colors, getThemeValue } from '../config/themeTokens'

/**
 * Footer component displaying branding and informational text.
 * Shows callout.city branding and important disclaimers about on-chain data.
 */
export function Footer() {
  const footerBorder = useColorModeValue(
    getThemeValue(boxShadows.borderDividerTop, 'light'),
    getThemeValue(boxShadows.borderDividerTop, 'dark')
  )
  const footerText = useColorModeValue(
    getThemeValue(colors.text.footer, 'light'),
    getThemeValue(colors.text.footer, 'dark')
  )
  const footerTextMuted = useColorModeValue(
    getThemeValue(colors.text.footerMuted, 'light'),
    getThemeValue(colors.text.footerMuted, 'dark')
  )
  const footerBrand = useColorModeValue(
    getThemeValue(colors.text.footerBrand, 'light'),
    getThemeValue(colors.text.footerBrand, 'dark')
  )

  return (
    <Box
      textAlign="center"
      py={8}
      mt={0}
      borderTop="none"
      boxShadow={footerBorder}
    >
      <Flex
        justify="center"
        align="center"
        gap={2}
        mb={0}
      >
        <Box
          w="22px"
          h="22px"
          borderRadius={0}
          bg={colors.accent.red.bg}
          border="none"
          boxShadow={`0 0 0 1px ${colors.accent.red.border}`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="10px"
        >
          ⊕
        </Box>
        <Text
          fontSize="xs"
          fontWeight="800"
          letterSpacing="0.15em"
          textTransform="uppercase"
          color={footerBrand}
        >
          callout.city
        </Text>
      </Flex>
      <Text fontSize="xs" color={footerText} lineHeight="1.8">
        Messages are encoded as hex in transaction calldata. Zero-value transfers only.
      </Text>
      <Text fontSize="xs" color={footerTextMuted} mt={0.5}>
        All on-chain data is public and permanent. Act accordingly.
      </Text>
    </Box>
  )
}
