import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Box, VStack, HStack, Text, Button, useToast } from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/react'
import { borderRadius, boxShadows } from '../../config/themeTokens'
import { useThemeTextColor, useAccentTextColor, useAccentBgColor, useAccentBorderColor, usePurpleMetaColors } from '../../shared/useThemeColors'
import { ThemedTextarea } from '../../shared/ThemedTextarea'
import { type BatchRow } from './types'

interface MessageEditorProps {
  row: BatchRow
  rowIndex: number
  templateString: string
  interpolatedMessage: string
  onMessageChange: (message: string) => void
  onReset: () => void
  onClose: () => void
}

export function MessageEditor({ row, rowIndex, templateString, interpolatedMessage, onMessageChange, onReset, onClose }: MessageEditorProps) {
  const textExtraMuted = useThemeTextColor('extraMuted')
  const toast = useToast()
  const purpleMeta = usePurpleMetaColors()
  const purpleTextLight = useAccentTextColor('purpleLight')
  // Derive the current template from row.message or templateString
  const currentTemplate = useMemo(() => {
    return row.message && row.message.includes('${') ? row.message : templateString
  }, [row.message, templateString])

  const [editedTemplate, setEditedTemplate] = useState(() => currentTemplate)
  const [isFocused, setIsFocused] = useState(false)
  const previousTemplateRef = useRef(currentTemplate)

  // Update local state when templateString changes externally, but preserve user edits
  useEffect(() => {
    // Only update if the template changed externally (not from user edit)
    if (currentTemplate !== previousTemplateRef.current) {
      // Check if user has made edits by comparing with what we expect
      const expectedTemplate = previousTemplateRef.current
      // If editedTemplate matches the old template, user hasn't edited, so update
      // If it doesn't match, user has edited, so preserve their edits
      if (editedTemplate === expectedTemplate) {
        setEditedTemplate(currentTemplate)
      }
      previousTemplateRef.current = currentTemplate
    }
  }, [currentTemplate, editedTemplate])

  const handleCopyInterpolated = useCallback(() => {
    navigator.clipboard.writeText(interpolatedMessage)
    toast({
      title: 'Copied!',
      description: 'Interpolated message copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }, [interpolatedMessage, toast])

  const handleTemplateChange = useCallback((value: string) => {
    setEditedTemplate(value)
    // Store the template string (with variables) in row.message
    onMessageChange(value)
  }, [onMessageChange])

  const handleReset = useCallback(() => {
    setEditedTemplate(templateString)
    onReset()
  }, [templateString, onReset])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  // Show template when focused, interpolated when not focused
  const displayValue = isFocused ? editedTemplate : interpolatedMessage

  return (
    <Box
      py={4}
      bg={purpleMeta.bg}
      borderRadius={borderRadius.none}
      border="none"
      boxShadow={purpleMeta.borderShadow}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between" px={4}>
          <Text fontSize="sm" fontWeight="700" color={purpleTextLight}>
            💬 Message Preview — Row {rowIndex + 1}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="purple"
            onClick={onClose}
          >
            ✕ Close
          </Button>
        </HStack>

        <Box
          mx={{ base: -4, md: -6 }}
          px={{ base: 4, md: 6 }}
        >
          <ThemedTextarea
            value={displayValue}
            onChange={(e) => handleTemplateChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            size="xs"
            monospace
            minH="200px"
            readOnly={!isFocused}
          />
        </Box>

        <HStack px={4} spacing={2}>
          <Button
            size="sm"
            colorScheme="purple"
            variant="outline"
            onClick={handleReset}
          >
            🔄 Reset to Template
          </Button>
          <Button
            size="sm"
            colorScheme="purple"
            variant="ghost"
            onClick={handleCopyInterpolated}
          >
            📋 Copy Interpolated
          </Button>
          <Text fontSize="xs" color={textExtraMuted}>
            Edit the template above, then sign when ready
          </Text>
        </HStack>
      </VStack>
    </Box>
  )
}
