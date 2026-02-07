import { Box, HStack, Text, Badge } from '@chakra-ui/react'
import { borderRadius } from '../../config/themeTokens'
import { useThemeTextColor, useThemeBgColor, useAccentBorderColor, useAccentTextColor, usePurpleMetaColors } from '../../shared/useThemeColors'
import { useColorModeValue } from '@chakra-ui/react'
import { getThemeValue, boxShadows } from '../../config/themeTokens'
import { CHAIN_INFO } from '@callout/shared/types'
import { ChainIcon } from '../../shared/ChainIcon'

interface TransactionMetadataProps {
  txMeta: {
    from: string
    to: string | null
    chainId: number
    hash: string
  }
}

/**
 * Transaction metadata display component.
 * Shows transaction from/to addresses and chain information.
 */
export function TransactionMetadata({ txMeta }: TransactionMetadataProps) {
  const cardBg = useThemeBgColor('card')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const textExtraMuted = useThemeTextColor('extraMuted')

  const purpleMeta = usePurpleMetaColors()
  const purpleTextLight = useAccentTextColor('purpleLight')
  const badgeBg = useThemeBgColor('card')
  const badgeBoxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )

  const truncateAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

  return (
    <Box
      py={1.5}
      px={0}
      bg={cardBg}
      borderRadius={borderRadius.none}
      border="none"
      boxShadow={purpleMeta.borderShadow}
    >
      <HStack spacing={4} flexWrap="wrap" gap={2} px={4}>
        <HStack spacing={1.5}>
          <Text fontSize="10px" color={textVeryMuted} fontWeight="700" textTransform="uppercase">
            From
          </Text>
          <Text fontSize="xs" fontFamily="mono" color={purpleTextLight} fontWeight="600">
            {truncateAddr(txMeta.from)}
          </Text>
        </HStack>
        {txMeta.to && (
          <HStack spacing={1.5}>
            <Text fontSize="10px" color={textVeryMuted} fontWeight="700" textTransform="uppercase">
              To
            </Text>
            <Text fontSize="xs" fontFamily="mono" color={purpleTextLight} fontWeight="600">
              {truncateAddr(txMeta.to)}
            </Text>
          </HStack>
        )}
        <Badge
          fontSize="9px"
          fontWeight="700"
          borderRadius={borderRadius.none}
          px={2}
          py={0.5}
          bg={badgeBg}
          color={textExtraMuted}
          border="none"
          boxShadow={badgeBoxShadow}
        >
          <HStack spacing={1} align="center">
            <ChainIcon chainId={txMeta.chainId} w="12px" h="12px" />
            <Text>{CHAIN_INFO[txMeta.chainId]?.name ?? `Chain ${txMeta.chainId}`}</Text>
          </HStack>
        </Badge>
      </HStack>
    </Box>
  )
}
