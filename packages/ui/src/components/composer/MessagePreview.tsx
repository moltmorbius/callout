import { Box, HStack, Text, Button } from '@chakra-ui/react'
import { useState } from 'react'
import { useThemeTextColor, useThemeBgColor, useAccentTextColor } from '../../shared/useThemeColors'
import { ThemedTextarea } from '../../shared/ThemedTextarea'

interface MessagePreviewProps {
  message: string
  isTemplateFilled: boolean
  onMessageChange?: (message: string) => void
}

/**
 * Message preview component with edit functionality.
 * Shows the final message and allows editing when enabled.
 */
export function MessagePreview({ message, isTemplateFilled, onMessageChange }: MessagePreviewProps) {
  const [isEditingMessage, setIsEditingMessage] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message)

  const textVeryMuted = useThemeTextColor('veryMuted')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const textMuted = useThemeTextColor('muted')
  const interactiveHoverBg = useThemeBgColor('interactiveHover')
  const greenText = useAccentTextColor('green')
  const greenTextLight = useAccentTextColor('greenLight')

  const handleEditMessage = () => {
    setEditedMessage(message)
    setIsEditingMessage(true)
  }

  const handleSaveEdit = () => {
    setIsEditingMessage(false)
    if (onMessageChange) {
      onMessageChange(editedMessage)
    }
  }

  return (
    <>
      <HStack mb={2} justify="space-between">
        <Text fontSize="10px" color={textVeryMuted} fontWeight="700"
          letterSpacing="0.08em" textTransform="uppercase">
          {isEditingMessage ? 'Custom Edit Mode' : 'Live Preview'}
        </Text>
        {isTemplateFilled && (
          <Button
            size="xs"
            variant="ghost"
            fontSize="xs"
            color={isEditingMessage ? greenText : textVeryMuted}
            _hover={{ color: isEditingMessage ? greenTextLight : textMuted, bg: interactiveHoverBg }}
            onClick={isEditingMessage ? handleSaveEdit : handleEditMessage}
          >
            {isEditingMessage ? '✓ Done' : '✏️ Edit'}
          </Button>
        )}
      </HStack>
      {isEditingMessage ? (
        <ThemedTextarea
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          size="sm"
          lineHeight="1.7"
          rows={6}
        />
      ) : (
        <Text
          fontSize="sm"
          color={textExtraMuted}
          fontStyle="italic"
          lineHeight="1.7"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          {message}
        </Text>
      )}
    </>
  )
}
