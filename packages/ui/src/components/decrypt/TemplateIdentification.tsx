import { Box, HStack, Text } from '@chakra-ui/react'
import { borderRadius } from '../../config/themeTokens'
import { useThemeTextColor, useAccentBorderColor, useThemeBgColor, useAccentTextColor } from '../../shared/useThemeColors'
import { type MessageTemplate } from '@callout/shared/templates'

interface TemplateIdentificationProps {
  template: MessageTemplate
}

/**
 * Template identification display component.
 * Shows which template was recognized from the decoded message.
 */
export function TemplateIdentification({ template }: TemplateIdentificationProps) {
  const cardBg = useThemeBgColor('card')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const purpleTextLight = useAccentTextColor('purpleLight')

  const purpleBorder = useAccentBorderColor('purple', 'borderMeta')
  const purpleBorderShadow = `0 0 0 1px ${purpleBorder}`

  return (
    <Box
      py={1.5}
      px={0}
      bg={cardBg}
      borderRadius={borderRadius.none}
      border="none"
      boxShadow={purpleBorderShadow}
    >
      <Box px={4}>
      <HStack spacing={2} mb={1}>
        <Text fontSize="sm">{template.emoji}</Text>
        <Text
          fontSize="xs"
          fontWeight="800"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color={purpleTextLight}
        >
          Template Identified
        </Text>
      </HStack>
        <HStack spacing={1.5}>
          <Text fontSize="10px" color={textVeryMuted} fontWeight="700" textTransform="uppercase">
            {template.name}
          </Text>
        </HStack>
      </Box>
    </Box>
  )
}
