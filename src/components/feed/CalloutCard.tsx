import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Link,
  Tooltip,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useCardStyle } from '../../shared/styles'
import { SectionLabel } from '../../shared/SectionLabel'
import { colors, boxShadows, getThemeValue, spacing } from '../../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { useThemeTextColor, useThemeBgColor, useAccentBgColor, useAccentBorderColor, useAccentTextColor, usePurpleMetaColors, useRedMetaColors } from '../../shared/useThemeColors'
import { CHAIN_INFO, getCalloutTxUrl, getCalloutAddressUrl } from '../../types/callout'
import type { Callout } from '../../types/callout'
import { borderRadius } from '../../config/themeTokens'
import { truncateAddress, formatTimeAgo, truncateMessage } from '../../utils/formatting'

/* ── Animations ──────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

interface CalloutCardProps {
  readonly callout: Callout
  readonly index: number
}

/**
 * Card component that displays a single callout message.
 * Shows sender, target, message preview, chain info, and transaction link.
 */
export function CalloutCard({ callout, index }: CalloutCardProps) {
  const chain = CHAIN_INFO[callout.chainId]
  const txUrl = getCalloutTxUrl(callout.chainId, callout.txHash)
  const targetUrl = getCalloutAddressUrl(callout.chainId, callout.target)
  const cardStyleContent = useCardStyle(false)
  const textSecondary = useThemeTextColor('secondary')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const textMuted = useThemeTextColor('muted')

  // Theme values
  const cardHoverShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCardHover, 'light'),
    getThemeValue(boxShadows.borderCardHover, 'dark')
  )
  const cardHoverBg = useColorModeValue(
    getThemeValue(colors.bg.cardHover, 'light'),
    getThemeValue(colors.bg.cardHover, 'dark')
  )
  const tooltipBg = useThemeBgColor('tooltip')
  const tooltipText = useThemeTextColor('primary')
  const badgeBg = useThemeBgColor('card')
  const cardBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const redMeta = useRedMetaColors()
  const redBgSubtle = useAccentBgColor('red', 'bg')
  const purpleMeta = usePurpleMetaColors()
  const redText = useAccentTextColor('red')
  const redTextLight = useAccentTextColor('redLight')
  const purpleTextLight = useAccentTextColor('purpleLight')
  const dividerTopShadow = useColorModeValue(
    '0 -1px 0 0 rgba(0, 0, 0, 0.1)',
    '0 -1px 0 0 rgba(255, 255, 255, 0.1)'
  )

  return (
    <Box
      data-testid="callout-card"
      {...cardStyleContent}
      p={{ base: spacing.cardPadding.base, md: spacing.cardPadding.md }}
      position="relative"
      overflow="hidden"
      transition="all 0.1s ease"
      animation={`${fadeIn} 0.1s ease ${index * 0.06}s both`}
      _hover={{
        boxShadow: cardHoverShadow,
        bg: cardHoverBg,
        transform: 'translateY(-1px)',
      }}
    >
      {/* Top accent line */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="1px"
        bgGradient="linear(to-r, transparent, rgba(220,38,38,0.3), transparent)"
      />

      {/* Header row: sender + chain + timestamp */}
      <HStack justify="space-between" align="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <HStack spacing={2} minW={0}>
          {/* Sender identicon */}
          <Box
            w="32px"
            h="32px"
            borderRadius={borderRadius.none}
            bg={redMeta.bg}
            border="none"
            boxShadow={redMeta.borderShadow}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Text fontSize="xs" fontWeight="700" color={redText}>
              📡
            </Text>
          </Box>
          <Box minW={0}>
            <Tooltip label={callout.sender} placement="top" bg={tooltipBg} color={tooltipText} fontSize="xs" borderRadius={borderRadius.none}>
              <Text
                fontSize="sm"
                fontFamily="mono"
                fontWeight="600"
                color={textSecondary}
                letterSpacing="0.02em"
              >
                {truncateAddress(callout.sender)}
              </Text>
            </Tooltip>
            <Text fontSize="10px" color={textExtraMuted} fontWeight="500">
              caller
            </Text>
          </Box>
        </HStack>

        <HStack spacing={2} flexShrink={0}>
          {/* Chain badge */}
          {chain && (
            <Badge
              variant="subtle"
              fontSize="9px"
              fontWeight="700"
              letterSpacing="0.05em"
              borderRadius="md"
              px={2}
              py={0.5}
              bg={badgeBg}
              color={textMuted}
              border="none"
              boxShadow={cardBorderShadow}
            >
              {chain.emoji} {chain.name}
            </Badge>
          )}
          {/* Timestamp */}
          <Tooltip
            label={new Date(callout.timestamp * 1000).toLocaleString()}
            placement="top"
            bg={tooltipBg}
            color={tooltipText}
            fontSize="xs"
            borderRadius="lg"
          >
            <Text fontSize="xs" color={textExtraMuted} fontWeight="500" whiteSpace="nowrap">
              {formatTimeAgo(callout.timestamp)}
            </Text>
          </Tooltip>
        </HStack>
      </HStack>

      {/* Target address */}
      <Box
        mb={3}
        p={2.5}
        bg={redBgSubtle}
        borderRadius={borderRadius.none}
        border="none"
        boxShadow="0 0 0 1px rgba(220, 38, 38, 0.1)"
      >
        <HStack spacing={2}>
          <Text fontSize="10px" color={redText} fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
            🎯 Target
          </Text>
          <Tooltip label={callout.target} placement="top" bg={tooltipBg} color={tooltipText} fontSize="xs" borderRadius="lg">
            <Link
              href={targetUrl}
              isExternal
              fontSize="xs"
              fontFamily="mono"
              fontWeight="600"
              color={redTextLight}
              _hover={{ color: redText, textDecoration: 'underline' }}
              letterSpacing="0.02em"
            >
              {truncateAddress(callout.target)}
            </Link>
          </Tooltip>
        </HStack>
      </Box>

      {/* Message preview */}
      <Box mb={3}>
        {callout.encrypted ? (
          <HStack spacing={2} p={3} bg={purpleMeta.bg} borderRadius={borderRadius.none} border="none" boxShadow={purpleMeta.borderShadow}>
            <Text fontSize="sm">🔒</Text>
            <Text fontSize="sm" color={purpleTextLight} fontStyle="italic" fontWeight="500">
              Encrypted message — passphrase required to decrypt
            </Text>
          </HStack>
        ) : (
          <Text
            fontSize="sm"
            color={textSecondary}
            lineHeight="1.7"
            noOfLines={4}
          >
            {truncateMessage(callout.message)}
          </Text>
        )}
      </Box>

      {/* Footer: tx link */}
      <HStack justify="space-between" align="center" pt={2} borderTop="none" boxShadow={dividerTopShadow}>
        <Link
          href={txUrl}
          isExternal
          fontSize="xs"
          fontWeight="600"
          color={textExtraMuted}
          letterSpacing="0.03em"
          _hover={{ color: redTextLight, textDecoration: 'none' }}
          transition="color 0.1s"
        >
          View TX →
        </Link>
        <Text fontSize="10px" fontFamily="mono" color={textExtraMuted}>
          {callout.txHash.slice(0, 10)}…{callout.txHash.slice(-6)}
        </Text>
      </HStack>
    </Box>
  )
}
