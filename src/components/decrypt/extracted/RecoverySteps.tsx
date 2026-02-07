import { Box, VStack, HStack, Text, Code, Button, Divider } from '@chakra-ui/react'
import { borderRadius, boxShadows, getThemeValue } from '../../../config/themeTokens'
import { useThemeBgColor, useThemeTextColor, useAccentTextColor, useAccentBgColor } from '../../../shared/useThemeColors'
import { useColorModeValue } from '@chakra-ui/react'
import { ChainIcon } from '../../../shared/ChainIcon'
import { TokenIcon } from '../../../shared/TokenIcon'
import { type ParsedTransaction } from '../../../services/transactionParser'
import { type ExtractedTemplateData } from '../../../utils/templateExtraction'
import { type RecoveryAmount } from './useRecoveryAmounts'

interface RecoveryStepsProps {
  recoveryAmounts: RecoveryAmount[]
  extractedData: ExtractedTemplateData | null
  parsedTransaction: ParsedTransaction | null
  effectiveChainId: number
  sendingIndex: number | null
  onSendRecovery: (recoveryAmount: RecoveryAmount, index: number) => void
}

/**
 * Displays recovery steps with calculated recovery amounts and send buttons.
 * Shows the formula: scammer address → percentage → amount → recovery address.
 */
export function RecoverySteps({
  recoveryAmounts,
  extractedData,
  parsedTransaction,
  effectiveChainId,
  sendingIndex,
  onSendRecovery,
}: RecoveryStepsProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  const cardBg = useThemeBgColor('card')
  const inputBg = useThemeBgColor('input')
  const greenLight = useAccentTextColor('greenLight')
  const green = useAccentTextColor('green')
  const redLight = useAccentTextColor('redLight')
  const greenHoverBg = useAccentBgColor('green', 'bgSubtle')
  const boxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )

  if (recoveryAmounts.length === 0 || !extractedData?.receiveAddress || !parsedTransaction?.scammer) {
    return null
  }

  const truncateAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

  return (
    <Box px={0}>
      <Text fontSize="xs" fontWeight="700" color={greenLight} mb={2} px={4} pt={1.5}>
        To resolve, execute the steps below:
      </Text>
      <VStack align="stretch" spacing={1.5} px={0} pb={1.5}>
        {recoveryAmounts.map((ra, index) => (
          <HStack key={index} spacing={2} align="center" px={4} py={1.5} bg={cardBg} borderRadius={borderRadius.none} boxShadow={boxShadow}>
            <ChainIcon chainId={effectiveChainId} w="20px" h="20px" />
            <Code fontSize="xs" bg={inputBg} color={redLight} fontFamily="mono" px={2} py={0.5}>
              {truncateAddr(parsedTransaction?.scammer || '')}
            </Code>
            <Text fontSize="xs" color={greenLight} fontWeight="600">
              {extractedData?.recoveryPercentage}%
            </Text>
            <Text fontSize="xs" color={textVeryMuted}>=</Text>
            <Text fontSize="xs" color={greenLight} fontFamily="mono" fontWeight="700">
              {ra.formattedAmount}
            </Text>
            <HStack spacing={1} align="center">
              {ra.type === 'native' ? (
                <ChainIcon chainId={effectiveChainId} w="16px" h="16px" />
              ) : (
                <TokenIcon
                  chainId={effectiveChainId}
                  tokenAddress={ra.token?.address ?? null}
                  tokenSymbol={ra.token?.symbol || 'ETH'}
                  w="16px"
                  h="16px"
                />
              )}
              <Text fontSize="xs" color={greenLight} fontWeight="600">
                {ra.token?.symbol || 'ETH'}
              </Text>
            </HStack>
            <Text fontSize="xs" color={textVeryMuted}>→</Text>
            <Code fontSize="xs" bg={inputBg} color={greenLight} fontFamily="mono" px={2} py={0.5}>
              {truncateAddr(extractedData?.receiveAddress || '')}
            </Code>
            <Button
              size="xs"
              variant="ghost"
              fontSize="xs"
              color={green}
              _hover={{ color: greenLight, bg: greenHoverBg }}
              isLoading={sendingIndex === index}
              isDisabled={sendingIndex !== null}
              onClick={() => onSendRecovery(ra, index)}
            >
              Send
            </Button>
          </HStack>
        ))}
      </VStack>
    </Box>
  )
}
