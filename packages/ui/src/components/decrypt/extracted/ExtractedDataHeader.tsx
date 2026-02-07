import { HStack, Text, Button, Tooltip, VStack } from '@chakra-ui/react'
import { useThemeBgColor, useThemeTextColor, useAccentTextColor } from '../../../shared/useThemeColors'
import { borderRadius } from '../../../config/themeTokens'
import { type MessageTemplate } from '@callout/shared/templates'
import { type ParsedSignedMessage } from '@callout/shared/crypto'
import { type Address } from 'viem'

interface ExtractedDataHeaderProps {
  template: MessageTemplate | null
  parsedSigned: ParsedSignedMessage | null
  recoveredAddress: Address | null | undefined
  extractedData: {
    theftTxHash?: string | null
  } | null
  onFetchTransaction?: () => void
  isFetchingTransaction?: boolean
  onToggleExpanded: () => void
  isExpanded: boolean
}

/**
 * Header component for ExtractedData section.
 * Displays template identification with recovery formula tooltip and action buttons.
 */
export function ExtractedDataHeader({
  template,
  parsedSigned,
  recoveredAddress,
  extractedData,
  onFetchTransaction,
  isFetchingTransaction = false,
  onToggleExpanded,
  isExpanded,
}: ExtractedDataHeaderProps) {
  const textMuted = useThemeTextColor('muted')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const cardBg = useThemeBgColor('card')
  const purpleTextLight = useAccentTextColor('purpleLight')
  const blue = useAccentTextColor('blue')
  const blueLight = useAccentTextColor('blueLight')
  const dividerColor = useThemeBgColor('borderOverlaySubtle')

  return (
    <HStack justify="space-between" mb={1.5} px={4}>
      <HStack spacing={2}>
        <Text fontSize="sm">{template?.emoji || '🔍'}</Text>
        <HStack spacing={2}>
          {template && (
            <>
              <Tooltip
                label={
                  parsedSigned && recoveredAddress ? (
                    <VStack align="start" spacing={1} fontSize="xs" fontFamily="mono">
                      <Text>MESSAGE: "{parsedSigned.message}"</Text>
                      <Text>SIGNATURE: {parsedSigned.signature}</Text>
                      <Text>recover(utf8ToHex(message), signature) → {recoveredAddress}</Text>
                    </VStack>
                  ) : (
                    <Text fontSize="xs">Template pattern matched from decoded message</Text>
                  )
                }
                placement="top"
                hasArrow
                bg={cardBg}
                color={textMuted}
                border="1px solid"
                borderColor={dividerColor}
                borderRadius={borderRadius.none}
                px={3}
                py={2}
              >
                <Text
                  fontSize="xs"
                  fontWeight="800"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color={purpleTextLight}
                  cursor="help"
                >
                  Template Identified
                </Text>
              </Tooltip>
              <Text fontSize="xs" color={textVeryMuted}>
                •
              </Text>
            </>
          )}
          {template && (
            <Text fontSize="10px" color={textVeryMuted} fontWeight="700" textTransform="uppercase" ml={1}>
              {template.name}
            </Text>
          )}
        </HStack>
      </HStack>
      <HStack spacing={2}>
        {extractedData?.theftTxHash && onFetchTransaction && !isFetchingTransaction && (
          <Button
            size="xs"
            variant="ghost"
            fontSize="xs"
            color={blue}
            _hover={{ color: blueLight }}
            onClick={onFetchTransaction}
          >
            Fetch TX
          </Button>
        )}
        {isFetchingTransaction && (
          <Text fontSize="xs" color={textVeryMuted}>
            Loading...
          </Text>
        )}
        <Button
          size="xs"
          variant="ghost"
          fontSize="xs"
          color={textVeryMuted}
          _hover={{ color: textMuted }}
          onClick={onToggleExpanded}
        >
          {isExpanded ? '−' : '+'}
        </Button>
      </HStack>
    </HStack>
  )
}
