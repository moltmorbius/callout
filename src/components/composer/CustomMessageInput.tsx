import { Box, HStack, Text, Badge } from '@chakra-ui/react'
import { ThemedTextarea } from '../../shared/ThemedTextarea'
import { useThemeTextColor } from '../../shared/useThemeColors'

interface CustomMessageInputProps {
  value: string
  onChange: (value: string) => void
  onBack?: () => void
}

/**
 * Custom message input component with breadcrumb navigation.
 */
export function CustomMessageInput({ value, onChange, onBack }: CustomMessageInputProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const textMuted = useThemeTextColor('muted')

  return (
    <>
      <HStack mb={4} spacing={2}>
        {onBack && (
          <>
            <Box
              as="button"
              fontSize="xs" color={textVeryMuted}
              fontWeight="700" letterSpacing="0.05em"
              cursor="pointer" transition="color 0.1s"
              _hover={{ color: textMuted }}
              onClick={onBack}
            >
              ← Categories
            </Box>
            <Text fontSize="xs" color={textExtraMuted}>/</Text>
          </>
        )}
        <Badge
          colorScheme="purple" variant="subtle"
          fontSize="10px" borderRadius="md" px={2}
        >
          ✍️ Custom
        </Badge>
      </HStack>

      <ThemedTextarea
        placeholder="Type your message..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Custom message text"
        size="sm"
        rows={5}
      />
    </>
  )
}
