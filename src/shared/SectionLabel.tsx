import { HStack, Text, useColorModeValue } from '@chakra-ui/react'
import { useThemeTextColor } from './useThemeColors'

interface SectionLabelProps {
  icon: string
  label: string
  accent?: string
}

/**
 * Reusable section label with icon and uppercase styling.
 */
export function SectionLabel({ icon, label, accent }: SectionLabelProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  return (
    <HStack spacing={2.5} mb={2}>
      <Text fontSize="sm" opacity={0.7}>{icon}</Text>
      <Text
        fontSize="11px"
        fontWeight="800"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color={accent || textVeryMuted}
      >
        {label}
      </Text>
    </HStack>
  )
}
