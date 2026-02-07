import { Box, VStack, HStack, Text, IconButton, Badge } from '@chakra-ui/react'
import { Icon } from '@iconify/react'
import { useThemeBgColor, useThemeTextColor } from './useThemeColors'
import { boxShadows, borderRadius, getThemeValue } from '../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { ThemedReadOnlyDisplay } from './ThemedReadOnlyDisplay'
import { decodeMessage } from '@callout/shared/encoding'
import { type Hex } from 'viem'
import { useState } from 'react'

interface CalldataPreviewProps {
  /** Hex calldata to preview */
  hexCalldata: Hex
  /** Optional label for the preview section */
  label?: string
  /** Whether to show by default (collapsed/expanded) */
  defaultExpanded?: boolean
  /** Verification status: 'verified' shows green badge, 'error' shows red badge */
  verificationStatus?: 'verified' | 'error' | null
}

/**
 * Preview component showing hex calldata and its decoded UTF-8 message.
 * Useful for verifying what will be sent in a transaction before signing.
 */
export function CalldataPreview({ hexCalldata, label = 'Transaction Preview', defaultExpanded = false, verificationStatus }: CalldataPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [copiedHex, setCopiedHex] = useState(false)
  const [copiedText, setCopiedText] = useState(false)

  const cardBg = useThemeBgColor('card')
  const textMuted = useThemeTextColor('muted')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const hoverBg = useThemeBgColor('interactiveHover')
  const labelColor = useThemeTextColor('label')
  const boxShadowValue = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200')

  // Extract verification status from label if not provided (backward compatibility)
  let effectiveVerificationStatus = verificationStatus
  let cleanLabel = label
  if (!effectiveVerificationStatus && label) {
    if (label.includes('✓ Verified')) {
      effectiveVerificationStatus = 'verified'
      cleanLabel = label.replace(' ✓ Verified', '').replace('⚠️ Mismatch', '')
    } else if (label.includes('⚠️ Mismatch')) {
      effectiveVerificationStatus = 'error'
      cleanLabel = label.replace(' ✓ Verified', '').replace('⚠️ Mismatch', '')
    }
  }

  let decodedMessage: string
  try {
    decodedMessage = decodeMessage(hexCalldata)
  } catch (err) {
    decodedMessage = `Error decoding: ${err instanceof Error ? err.message : String(err)}`
  }

  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(hexCalldata)
      setCopiedHex(true)
      setTimeout(() => setCopiedHex(false), 2000)
    } catch {
      // Ignore clipboard errors
    }
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(decodedMessage)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    } catch {
      // Ignore clipboard errors
    }
  }

  return (
    <Box
      bg={cardBg}
      borderRadius={borderRadius.none}
      border="none"
      mt="1px"
      _first={{
        mt: '0px'
      }}
      boxShadow={boxShadowValue}
      overflow="hidden"
    >
      <VStack align="stretch" spacing={0}>
        <HStack
          justify="space-between"
          px={4}
          py={2}
          cursor="pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          _hover={{ bg: hoverBg }}
        >
          <Text fontSize="xs" fontWeight="700" color={labelColor}>
            🔍 {cleanLabel}
          </Text>
          <HStack spacing={2} align="center">
            {effectiveVerificationStatus === 'verified' && (
              <Badge
                colorScheme="green"
                fontSize="xs"
                borderRadius={borderRadius.none}
                px={2}
                py={0.5}
              >
                ✓ Verified
              </Badge>
            )}
            {effectiveVerificationStatus === 'error' && (
              <Badge
                colorScheme="red"
                fontSize="xs"
                borderRadius={borderRadius.none}
                px={2}
                py={0.5}
              >
                ⚠️ Mismatch
              </Badge>
            )}
            <Icon
              icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'}
              width="16px"
              height="16px"
              color={textExtraMuted}
            />
          </HStack>
        </HStack>

        {isExpanded && (
          <HStack align="stretch" spacing={0} _last={{
            ml: '1px'
          }}>
            <Box flex={1} position="relative">
              <Box position="absolute" top={2} right={2} zIndex={1}>
                <IconButton
                  aria-label="Copy text"
                  icon={<Text fontSize="xs">{copiedText ? '✓' : '📋'}</Text>}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyText()
                  }}
                  colorScheme="purple"
                  minW="auto"
                  h="auto"
                  p={0}
                />
              </Box>
              <ThemedReadOnlyDisplay
                size="xs"
                p={2}
                minH="100px"
                maxH="150px"
              >
                {decodedMessage}
              </ThemedReadOnlyDisplay>
            </Box>

            <Box
              position="relative"
              w="1px"
              // bg={useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)')}
              bg="transparent"
              alignSelf="stretch"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="visible"
              zIndex={10}
            >
              <Box
                position="absolute"
                bg={cardBg}
                // bg="transparent"
                px={0}
                fontSize="xs"
                height={5}
                width={5}
                borderRadius="full"
                border="1px solid"
                borderColor={borderColor}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color={textMuted}
              >
                →
              </Box>
            </Box>

            <Box flex={1} position="relative">
              <Box position="absolute" top={2} right={2} zIndex={1}>
                <IconButton
                  aria-label="Copy hex"
                  icon={<Text fontSize="xs">{copiedHex ? '✓' : '📋'}</Text>}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyHex()
                  }}
                  colorScheme="purple"
                  minW="auto"
                  h="auto"
                  p={0}
                />
              </Box>
              <ThemedReadOnlyDisplay
                size="xs"
                monospace
                pl={2}
                pr={2}
                py={2}
                minH="100px"
                maxH="150px"
              >
                {hexCalldata}
              </ThemedReadOnlyDisplay>
            </Box>
          </HStack>
        )}
      </VStack>
    </Box>
  )
}
