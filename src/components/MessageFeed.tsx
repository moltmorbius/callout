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
import { mockCallouts } from '../data/mockCallouts'
import { CHAIN_INFO, getCalloutTxUrl, getCalloutAddressUrl } from '../types/callout'
import type { Callout } from '../types/callout'
import { cardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'

/* ── Animations ──────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

/* ── Helpers ──────────────────────────────────────────────────── */

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'just now'
  if (diff < 3600) {
    const mins = Math.floor(diff / 60)
    return `${mins}m ago`
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours}h ago`
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400)
    return `${days}d ago`
  }

  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

function truncateMessage(message: string, maxLength: number = 200): string {
  if (message.length <= maxLength) return message
  return message.slice(0, maxLength).trimEnd() + '…'
}

/* ── CalloutCard ─────────────────────────────────────────────── */

interface CalloutCardProps {
  readonly callout: Callout
  readonly index: number
}

function CalloutCard({ callout, index }: CalloutCardProps) {
  const chain = CHAIN_INFO[callout.chainId]
  const txUrl = getCalloutTxUrl(callout.chainId, callout.txHash)
  const targetUrl = getCalloutAddressUrl(callout.chainId, callout.target)

  return (
    <Box
      data-testid="callout-card"
      {...cardStyle}
      position="relative"
      overflow="hidden"
      transition="all 0.2s ease"
      animation={`${fadeIn} 0.4s ease ${index * 0.06}s both`}
      _hover={{
        borderColor: 'rgba(220, 38, 38, 0.2)',
        bg: 'rgba(14, 14, 30, 0.75)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
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
            borderRadius="lg"
            bg="rgba(220, 38, 38, 0.1)"
            border="1px solid"
            borderColor="rgba(220, 38, 38, 0.2)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Text fontSize="xs" fontWeight="700" color="red.400">
              📡
            </Text>
          </Box>
          <Box minW={0}>
            <Tooltip label={callout.sender} placement="top" bg="gray.800" fontSize="xs" borderRadius="lg">
              <Text
                fontSize="sm"
                fontFamily="mono"
                fontWeight="600"
                color="whiteAlpha.700"
                letterSpacing="0.02em"
              >
                {truncateAddress(callout.sender)}
              </Text>
            </Tooltip>
            <Text fontSize="10px" color="whiteAlpha.300" fontWeight="500">
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
              bg="rgba(255, 255, 255, 0.04)"
              color="whiteAlpha.500"
              border="1px solid"
              borderColor="whiteAlpha.50"
            >
              {chain.emoji} {chain.name}
            </Badge>
          )}
          {/* Timestamp */}
          <Tooltip
            label={new Date(callout.timestamp * 1000).toLocaleString()}
            placement="top"
            bg="gray.800"
            fontSize="xs"
            borderRadius="lg"
          >
            <Text fontSize="xs" color="whiteAlpha.300" fontWeight="500" whiteSpace="nowrap">
              {formatTimeAgo(callout.timestamp)}
            </Text>
          </Tooltip>
        </HStack>
      </HStack>

      {/* Target address */}
      <Box
        mb={3}
        p={2.5}
        bg="rgba(220, 38, 38, 0.04)"
        borderRadius="lg"
        border="1px solid"
        borderColor="rgba(220, 38, 38, 0.1)"
      >
        <HStack spacing={2}>
          <Text fontSize="10px" color="red.400" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
            🎯 Target
          </Text>
          <Tooltip label={callout.target} placement="top" bg="gray.800" fontSize="xs" borderRadius="lg">
            <Link
              href={targetUrl}
              isExternal
              fontSize="xs"
              fontFamily="mono"
              fontWeight="600"
              color="red.300"
              _hover={{ color: 'red.200', textDecoration: 'underline' }}
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
          <HStack spacing={2} p={3} bg="rgba(159, 122, 234, 0.06)" borderRadius="lg" border="1px solid" borderColor="rgba(159, 122, 234, 0.15)">
            <Text fontSize="sm">🔒</Text>
            <Text fontSize="sm" color="purple.300" fontStyle="italic" fontWeight="500">
              Encrypted message — passphrase required to decrypt
            </Text>
          </HStack>
        ) : (
          <Text
            fontSize="sm"
            color="whiteAlpha.600"
            lineHeight="1.7"
            noOfLines={4}
          >
            {truncateMessage(callout.message)}
          </Text>
        )}
      </Box>

      {/* Footer: tx link */}
      <HStack justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="whiteAlpha.50">
        <Link
          href={txUrl}
          isExternal
          fontSize="xs"
          fontWeight="600"
          color="whiteAlpha.300"
          letterSpacing="0.03em"
          _hover={{ color: 'red.300', textDecoration: 'none' }}
          transition="color 0.15s"
        >
          View TX →
        </Link>
        <Text fontSize="10px" fontFamily="mono" color="whiteAlpha.200">
          {callout.txHash.slice(0, 10)}…{callout.txHash.slice(-6)}
        </Text>
      </HStack>
    </Box>
  )
}

/* ── MessageFeed ─────────────────────────────────────────────── */

export function MessageFeed() {
  // Sort by newest first
  const sortedCallouts = [...mockCallouts].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <VStack spacing={4} align="stretch" data-testid="message-feed">
      {/* Feed header */}
      <Box {...cardStyle} py={4}>
        <HStack justify="space-between" align="center">
          <SectionLabel icon="📋" label="Recent Callouts" accent="red.400" />
          <Badge
            variant="outline"
            colorScheme="red"
            fontSize="10px"
            fontWeight="700"
            borderRadius="full"
            px={2.5}
          >
            {sortedCallouts.length} posted
          </Badge>
        </HStack>
        <Text fontSize="xs" color="whiteAlpha.300" lineHeight="1.6" mt={1}>
          Browse on-chain callouts posted by the community. All messages are permanently inscribed as transaction calldata.
        </Text>
      </Box>

      {/* Callout cards */}
      {sortedCallouts.length === 0 ? (
        <Box {...cardStyle} textAlign="center" py={12}>
          <Text fontSize="3xl" mb={3}>
            🔇
          </Text>
          <Text fontSize="md" fontWeight="600" color="whiteAlpha.400" mb={1}>
            No callouts yet
          </Text>
          <Text fontSize="sm" color="whiteAlpha.250">
            Be the first to put a scammer on blast.
          </Text>
        </Box>
      ) : (
        sortedCallouts.map((callout, index) => (
          <CalloutCard key={callout.id} callout={callout} index={index} />
        ))
      )}
    </VStack>
  )
}
