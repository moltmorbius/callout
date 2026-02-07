import { Box, VStack, HStack, Text } from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/react'
import { Icon } from '@iconify/react'
import { borderRadius } from '../../config/themeTokens'
import { useThemeTextColor, useAccentTextColor } from '../../shared/useThemeColors'
import { CHAIN_INFO } from '@callout/shared/types'
import { type BatchRow } from './types'
import { ChainIcon } from '../../shared/ChainIcon'

interface ChainSummaryProps {
  rows: BatchRow[]
  currentChainId: number
  processing: boolean
}

export function ChainSummary({ rows, currentChainId, processing }: ChainSummaryProps) {
  const textMuted = useThemeTextColor('muted')
  const orangeTextLight = useAccentTextColor('orangeLight')
  const orangeText = useAccentTextColor('orange')
  const greenText = useAccentTextColor('green')
  const purpleText = useAccentTextColor('purple')
  const orangeBgMeta = useColorModeValue('rgba(237, 137, 54, 0.08)', 'rgba(237, 137, 54, 0.06)')
  const orangeBorderMetaColor = useColorModeValue('rgba(237, 137, 54, 0.2)', 'rgba(237, 137, 54, 0.2)')
  const orangeBorderMeta = `0 0 0 1px ${orangeBorderMetaColor}`
  const orangeBgStrong = useColorModeValue('rgba(237, 137, 54, 0.2)', 'rgba(237, 137, 54, 0.3)')

  if (rows.length === 0) return null

  const uniqueChains = Array.from(new Set(rows.map((r) => r.chainId))) as number[]
  const signedRows = rows.filter((r) => r.status === 'signed')
  const chainsNeedingSwitch = uniqueChains.filter(
    (chainId) => chainId !== currentChainId && signedRows.some((r) => r.chainId === chainId)
  )
  const minPopups = signedRows.length
  const maxPopups = signedRows.length + chainsNeedingSwitch.length
  const popupRange = minPopups === maxPopups
    ? `${minPopups} popup${minPopups === 1 ? '' : 's'} total`
    : `${minPopups}-${maxPopups} popup${maxPopups === 1 ? '' : 's'} total`

  return (
    <Box
      px={{ base: 4, md: 6 }}
      py={3}
      bg={orangeBgMeta}
      borderRadius={borderRadius.none}
      border="none"
      boxShadow={orangeBorderMeta}
    >
      <VStack align="start" spacing={2}>
        <HStack spacing={2} align="center">
          <Text fontSize="xs" fontWeight="700" color={orangeTextLight}>
            ⛓️ Wallet Interactions Preview:
          </Text>
          {signedRows.length > 0 && (
            <Text fontSize="xs" color={textMuted} fontWeight="600">
              ({popupRange})
            </Text>
          )}
        </HStack>
        {uniqueChains.map((chainId, index) => {
          const isFirst = index === 0
          const chainRows = rows.filter((r) => r.chainId === chainId)
          const pendingCount = chainRows.filter((r) => r.status === 'signed').length
          const completedCount = chainRows.filter((r) => r.status === 'sent').length
          const totalCount = chainRows.length
          const isComplete = completedCount === totalCount && totalCount > 0
          const isCurrent = chainId === currentChainId
          const hasSendingRows = chainRows.some((r) => r.status === 'sending')
          const isProcessing = processing && (hasSendingRows || (isCurrent && pendingCount > 0))
          const needsSwitch = !isCurrent && pendingCount > 0
          const chainInfo = CHAIN_INFO[chainId]
          const chainName = chainInfo?.name ?? `Chain ${chainId}`
          const isProcessingNow = isProcessing || isFirst

          return (
            <Box key={chainId} w="100%">
              {needsSwitch && (
                <HStack spacing={2} align="center" mb={2}>
                  <Box w="16px" />
                  <Box
                    w="20px"
                    h="20px"
                    borderRadius="full"
                    bg={orangeBgStrong}
                    border="none"
                    boxShadow={`0 0 0 1px ${orangeBorderMetaColor}`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon icon="mdi:swap-horizontal-variant" width="12px" height="12px" color={orangeText} />
                  </Box>
                  <Text fontSize="xs" color={orangeText} fontWeight="600">
                    Switch Chain
                  </Text>
                </HStack>
              )}
              <HStack spacing={2} align="center" lineHeight={5}>
                {isComplete ? (
                  <Text fontSize="xs" color={greenText} fontWeight="600" w="16px" textAlign="center">
                    ✓
                  </Text>
                ) : isProcessingNow ? (
                  <Text fontSize="sm" color={purpleText} fontWeight="700" w="16px" textAlign="center">
                    →
                  </Text>
                ) : (
                  <Box w="16px" />
                )}
                <ChainIcon chainId={chainId} w="20px" h="20px" />
                <Text fontSize="xs" fontWeight="600" color={isCurrent ? greenText : textMuted}>
                  {chainName}
                </Text>
                {completedCount && (
                  <Text fontSize="xs" color={greenText} fontWeight="600">
                    {completedCount}x complete
                  </Text>
                )}
              </HStack>
              <VStack align="start" spacing={0} pl={7} mt={1}>
                {/* {pendingCount > 0 && (
                  <Text fontSize="xs" color={textMuted}>
                    • {pendingCount} transaction{pendingCount === 1 ? '' : 's'} to sign ({pendingCount} popup{pendingCount === 1 ? '' : 's'})
                  </Text>
                )} */}
                {completedCount > 0 && completedCount < totalCount && (
                  <Text fontSize="xs" color={greenText}>
                    • {completedCount} of {totalCount} complete
                  </Text>
                )}
              </VStack>
            </Box>
          )
        })}
      </VStack>
    </Box>
  )
}
