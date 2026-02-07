import { Box, HStack, Text, IconButton } from '@chakra-ui/react'
import { useState, useCallback, useMemo } from 'react'
import { useThemeBgColor, useThemeTextColor } from '../../shared/useThemeColors'
import { boxShadows, borderRadius, getThemeValue } from '../../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { ThemedReadOnlyDisplay } from '../../shared/ThemedReadOnlyDisplay'
import { type Hex } from 'viem'
import { type MessageTemplate } from '../../config/templates'

interface MessageStatePreviewProps {
  /** Raw template text (with ${variables}) */
  template?: string
  /** Interpolated message (template + vars filled) */
  interpolatedMessage: string
  /** Hex-encoded calldata */
  hexCalldata?: Hex
  /** Encrypted hex calldata (only shown when encryption enabled) */
  encryptedHexCalldata?: Hex
  /** Whether encryption is enabled and has a valid public key */
  encryptEnabled: boolean
  /** Selected template object (for getting raw template if not provided) */
  selectedTemplate?: MessageTemplate | null
}

type StateType = 'template' | 'interpolated' | 'hex' | 'encrypted'

interface StateConfig {
  type: StateType
  label: string
  content: string
  enabled: boolean
}

/**
 * Multi-state message preview component showing template, interpolated message,
 * hex calldata, and encrypted hex (when enabled).
 *
 * Features:
 * - Vertical bars with whole-word rotated text labels (book spine style)
 * - Copy buttons next to labels
 * - Toggle multiple states open with Cmd/Ctrl+click
 * - Arrow "next" button in bottom-right corner of expanded content
 * - No padding - hugs card walls
 * - Interpolated state is expanded by default
 */
export function MessageStatePreview({
  template,
  interpolatedMessage,
  hexCalldata,
  encryptedHexCalldata,
  encryptEnabled,
  selectedTemplate,
}: MessageStatePreviewProps) {
  // Get raw template from selectedTemplate if not provided
  const rawTemplate = useMemo(() => {
    if (template) return template
    if (selectedTemplate) return selectedTemplate.template
    return ''
  }, [template, selectedTemplate])

  // Build state configurations — encrypted column only appears when encryption
  // is enabled AND there is actual encrypted content to display
  const states: StateConfig[] = useMemo(() => {
    const configs: StateConfig[] = [
      {
        type: 'template',
        label: 'Template',
        content: rawTemplate,
        enabled: rawTemplate.length > 0,
      },
      {
        type: 'interpolated',
        label: 'Interpolated',
        content: interpolatedMessage,
        enabled: interpolatedMessage.length > 0,
      },
      {
        type: 'hex',
        label: 'Hex',
        content: hexCalldata || '',
        enabled: !!hexCalldata,
      },
    ]

    if (encryptEnabled && encryptedHexCalldata) {
      configs.push({
        type: 'encrypted',
        label: 'Encrypted',
        content: encryptedHexCalldata,
        enabled: true,
      })
    }

    return configs.filter(state => state.enabled)
  }, [rawTemplate, interpolatedMessage, hexCalldata, encryptedHexCalldata, encryptEnabled])

  // Track which states are expanded — interpolated is the default open state
  const [expandedStates, setExpandedStates] = useState<Set<StateType>>(new Set(['interpolated']))

  // Track copied states for visual feedback
  const [copiedStates, setCopiedStates] = useState<Set<StateType>>(new Set())

  // ── Theme colors (all hooks at top level) ──────────────────────────
  const cardBg = useThemeBgColor('card')
  const textMuted = useThemeTextColor('muted')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const hoverBg = useThemeBgColor('interactiveHover')
  const labelColor = useThemeTextColor('label')
  const boxShadowValue = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const borderColorValue = useColorModeValue('gray.200', 'whiteAlpha.200')

  /** Toggle a state panel open/closed. Cmd/Ctrl+click enables multi-select. */
  const handleToggleState = useCallback((stateType: StateType, event: React.MouseEvent) => {
    const isMultiSelect = event.metaKey || event.ctrlKey

    setExpandedStates(prev => {
      const next = new Set(prev)

      if (isMultiSelect) {
        // Multi-select: toggle the clicked state independently
        if (next.has(stateType)) {
          next.delete(stateType)
        } else {
          next.add(stateType)
        }
      } else {
        // Single-select: show only the clicked state (keep it open if already sole)
        if (next.has(stateType) && next.size === 1) {
          return next
        }
        next.clear()
        next.add(stateType)
      }

      return next
    })
  }, [])

  /** Advance to the next state (arrow button). Respects Cmd/Ctrl for multi. */
  const handleAdvanceToNext = useCallback((nextType: StateType, event: React.MouseEvent) => {
    event.stopPropagation()
    handleToggleState(nextType, event)
  }, [handleToggleState])

  /** Copy content to clipboard with brief visual feedback. */
  const handleCopy = useCallback(async (content: string, stateType: StateType, event?: React.MouseEvent) => {
    if (event) event.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      setCopiedStates(prev => new Set(prev).add(stateType))
      setTimeout(() => {
        setCopiedStates(prev => {
          const next = new Set(prev)
          next.delete(stateType)
          return next
        })
      }, 2000)
    } catch {
      // Ignore clipboard errors
    }
  }, [])

  if (states.length === 0) {
    return null
  }

  return (
    <Box
      bg={cardBg}
      borderRadius={borderRadius.none}
      border="none"
      mt="1px"
      boxShadow={boxShadowValue}
      overflow="hidden"
      mx={0}
      w="100%"
    >
      {/* Header */}
      <HStack justify="space-between" px={4} py={2}>
        <Text fontSize="xs" fontWeight="700" color={labelColor}>
          Message States
        </Text>
        {expandedStates.size > 1 && (
          <Text fontSize="10px" color={textExtraMuted} fontStyle="italic">
            Multi-view
          </Text>
        )}
      </HStack>

      {/* State panels row */}
      <HStack align="stretch" spacing={0} w="100%">
        {states.map((state, index) => {
          const isExpanded = expandedStates.has(state.type)
          const isCopied = copiedStates.has(state.type)
          const nextState = states[index + 1]

          return (
            <HStack
              key={state.type}
              align="stretch"
              spacing={0}
              flex={isExpanded ? 1 : 0}
              minW={isExpanded ? '200px' : '40px'}
            >
              {/* ── Vertical label bar (always visible) ── */}
              <Box
                w="40px"
                minW="40px"
                bg={isExpanded ? hoverBg : 'transparent'}
                cursor="pointer"
                onClick={(e) => handleToggleState(state.type, e)}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="flex-end"
                borderRight="1px solid"
                borderColor={borderColorValue}
                py={3}
                _hover={{ bg: hoverBg }}
              >
                {/* Copy button — shown when panel is expanded and has content */}
                {isExpanded && state.content && (
                  <IconButton
                    aria-label={`Copy ${state.label}`}
                    icon={<Text fontSize="10px">{isCopied ? '✓' : '📋'}</Text>}
                    size="xs"
                    variant="ghost"
                    onClick={(e) => handleCopy(state.content, state.type, e)}
                    colorScheme="purple"
                    minW="auto"
                    h="auto"
                    p={1}
                    mb={2}
                  />
                )}

                {/* Rotated whole-word label anchored to bottom */}
                <Box
                  position="relative"
                  w="40px"
                  h="70px"
                  overflow="hidden"
                  flexShrink={0}
                >
                  <Text
                    position="absolute"
                    bottom="4px"
                    left="50%"
                    transform="rotate(-90deg)"
                    transformOrigin="center center"
                    fontSize="9px"
                    fontWeight="700"
                    color={isExpanded ? labelColor : textExtraMuted}
                    letterSpacing="0.15em"
                    textTransform="uppercase"
                    whiteSpace="nowrap"
                    lineHeight="1"
                    /* Translate to center the rotated text on the bar's horizontal axis.
                       After rotation the text's width becomes its visual height, so
                       translateX(-50%) centers it on left:50%. */
                    sx={{
                      transform: 'translateX(-50%) rotate(-90deg)',
                    }}
                  >
                    {state.label}
                  </Text>
                </Box>
              </Box>

              {/* ── Content area (visible when expanded) ── */}
              {isExpanded && (
                <Box flex={1} position="relative" minW={0}>
                  <ThemedReadOnlyDisplay
                    size="xs"
                    p={2}
                    minH="120px"
                    maxH="200px"
                    monospace={state.type === 'hex' || state.type === 'encrypted'}
                    pl={4}
                    pr={2}
                  >
                    {state.content || (
                      <Text color={textExtraMuted} fontStyle="italic">
                        No content
                      </Text>
                    )}
                  </ThemedReadOnlyDisplay>

                  {/* Arrow → in bottom-right to advance to next state */}
                  {nextState && (
                    <Box
                      position="absolute"
                      bottom={2}
                      right={2}
                      bg={cardBg}
                      w={5}
                      h={5}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={borderColorValue}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      color={textMuted}
                      fontSize="xs"
                      zIndex={2}
                      onClick={(e) => handleAdvanceToNext(nextState.type, e)}
                      _hover={{
                        borderColor: labelColor,
                        color: labelColor,
                        bg: hoverBg,
                      }}
                    >
                      →
                    </Box>
                  )}
                </Box>
              )}
            </HStack>
          )
        })}
      </HStack>
    </Box>
  )
}
