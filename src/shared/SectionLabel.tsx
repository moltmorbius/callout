import { HStack, Text } from '@chakra-ui/react'

interface SectionLabelProps {
  icon: string
  label: string
  accent?: string
}

/**
 * Reusable section label with icon and uppercase styling.
 */
export function SectionLabel({ icon, label, accent }: SectionLabelProps) {
  return (
    <HStack spacing={2.5} mb={4}>
      <Text fontSize="sm" opacity={0.7}>{icon}</Text>
      <Text
        fontSize="11px"
        fontWeight="800"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color={accent || 'whiteAlpha.400'}
      >
        {label}
      </Text>
    </HStack>
  )
}
