import { Box, VStack, HStack, Text } from '@chakra-ui/react'
import { useThemeTextColor, useAccentTextColor } from '../../../shared/useThemeColors'
import { type ExtractedTemplateData } from '@callout/shared/templates'

interface ExtractedOtherFieldsProps {
  extractedData: ExtractedTemplateData | null
}

/**
 * Displays other extracted fields: Amount, Deadline, and Project Name.
 */
export function ExtractedOtherFields({ extractedData }: ExtractedOtherFieldsProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  const blueLight = useAccentTextColor('blueLight')

  if (!extractedData?.amount && !extractedData?.tokenName && !extractedData?.deadline && !extractedData?.projectName) {
    return null
  }

  return (
    <Box px={0}>
      <VStack align="stretch" spacing={1.5} px={4} py={1.5}>
        {/* Amount & Token */}
        {(extractedData?.amount || extractedData?.tokenName) && (
          <HStack justify="space-between">
            <Text fontSize="xs" color={textVeryMuted}>Amount:</Text>
            <Text fontSize="xs" color={blueLight} fontFamily="mono" fontWeight="600">
              {extractedData?.amount || '?'} {extractedData?.tokenName || ''}
            </Text>
          </HStack>
        )}

        {/* Deadline */}
        {extractedData?.deadline && (
          <HStack justify="space-between">
            <Text fontSize="xs" color={textVeryMuted}>Deadline:</Text>
            <Text fontSize="xs" color={blueLight} fontWeight="600">
              {extractedData.deadline}
            </Text>
          </HStack>
        )}

        {/* Project Name */}
        {extractedData?.projectName && (
          <HStack justify="space-between">
            <Text fontSize="xs" color={textVeryMuted}>Project:</Text>
            <Text fontSize="xs" color={blueLight} fontWeight="600">
              {extractedData.projectName}
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>
  )
}
