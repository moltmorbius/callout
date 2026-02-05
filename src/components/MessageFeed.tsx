import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Link,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import {
  fetchAddressTransactions,
  transactionsToCallouts,
  type BlockScoutNextPage,
} from '../services/explorer'
import { CHAIN_INFO, getCalloutTxUrl, getCalloutAddressUrl } from '../types/callout'
import type { Callout } from '../types/callout'
import { cardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'
import { classifyError, logErrorContext, withRetry, validateAddress } from '../utils/errorHandling'

/* ── Animations ──────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
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
  const { address: connectedAddress } = useAccount()
  const [addressInput, setAddressInput] = useState('')
  const [searchedAddress, setSearchedAddress] = useState<string | null>(null)
  const [callouts, setCallouts] = useState<Callout[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextPage, setNextPage] = useState<BlockScoutNextPage | null>(null)
  const [totalScanned, setTotalScanned] = useState(0)

  const handleSearch = useCallback(async () => {
    const addr = addressInput.trim()
    
    // Validate address with helpful feedback
    const validation = validateAddress(addr)
    if (!validation.isValid) {
      setError(`${validation.error}. ${validation.suggestion}`)
      return
    }

    setError(null)
    setCallouts([])
    setNextPage(null)
    setTotalScanned(0)
    setSearchedAddress(addr)
    setIsLoading(true)

    try {
      // Retry logic for network errors
      const data = await withRetry(
        async () => fetchAddressTransactions(addr),
        {
          maxAttempts: 3,
          delayMs: 1000,
          backoff: true,
        }
      )
      
      const decoded = transactionsToCallouts(data.items)
      setCallouts(decoded)
      setNextPage(data.next_page_params)
      setTotalScanned(data.items.length)
    } catch (err) {
      const errorContext = classifyError(err, {
        component: 'MessageFeed',
        address: addr,
      })
      
      logErrorContext(errorContext, 'MessageFeed.handleSearch')
      
      setError(`${errorContext.userMessage}: ${errorContext.actionableSteps.join(' • ')}`)
    } finally {
      setIsLoading(false)
    }
  }, [addressInput])

  const handleLoadMore = useCallback(async () => {
    if (!searchedAddress || !nextPage) return
    setIsLoadingMore(true)

    try {
      // Retry logic for pagination
      const data = await withRetry(
        async () => fetchAddressTransactions(searchedAddress, nextPage),
        {
          maxAttempts: 3,
          delayMs: 1000,
          backoff: true,
        }
      )
      
      const decoded = transactionsToCallouts(data.items)
      setCallouts((prev) => [...prev, ...decoded])
      setNextPage(data.next_page_params)
      setTotalScanned((prev) => prev + data.items.length)
    } catch (err) {
      const errorContext = classifyError(err, {
        component: 'MessageFeed',
        action: 'loadMore',
        address: searchedAddress,
      })
      
      logErrorContext(errorContext, 'MessageFeed.handleLoadMore')
      
      setError(`${errorContext.userMessage}: ${errorContext.actionableSteps.join(' • ')}`)
    } finally {
      setIsLoadingMore(false)
    }
  }, [searchedAddress, nextPage])

  return (
    <VStack spacing={4} align="stretch" data-testid="message-feed">
      {/* Search header */}
      <Box {...cardStyle} py={4}>
        <SectionLabel icon="📋" label="Callout Feed" accent="red.400" />
        <Text fontSize="xs" color="whiteAlpha.300" lineHeight="1.6" mt={1} mb={4}>
          See callout messages sent from an address. Connect your wallet to prove you're the sender.
        </Text>

        {/* Connected wallet shortcut — disappears once populated */}
        {connectedAddress && addressInput.toLowerCase() !== connectedAddress.toLowerCase() && (
          <Button
            variant="ghost"
            size="sm"
            h="28px"
            px={2}
            mb={1}
            fontSize="xs"
            fontFamily="mono"
            fontWeight="600"
            color="whiteAlpha.350"
            letterSpacing="0.02em"
            borderRadius="md"
            onClick={() => setAddressInput(connectedAddress)}
            _hover={{
              color: 'red.300',
              bg: 'transparent',
            }}
            transition="color 0.15s"
          >
            Use My Wallet: {truncateAddress(connectedAddress)}
          </Button>
        )}

        {/* Address input */}
        <HStack spacing={2}>
          <InputGroup flex={1}>
            <InputLeftElement h="44px" pointerEvents="none">
              <Text fontSize="sm" color="whiteAlpha.300">📤</Text>
            </InputLeftElement>
            <Input
              placeholder="0x… sender address"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              aria-label="Sender address to search"
              fontFamily="mono"
              fontSize="sm"
              h="44px"
              bg="rgba(6, 6, 15, 0.8)"
              borderColor="whiteAlpha.100"
              color="whiteAlpha.700"
              _placeholder={{ color: 'whiteAlpha.200' }}
              _focus={{
                borderColor: 'red.400',
                boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.3)',
              }}
            />
          </InputGroup>
          <Button
            h="44px"
            px={6}
            fontSize="sm"
            fontWeight="800"
            letterSpacing="0.04em"
            textTransform="uppercase"
            bg="rgba(220, 38, 38, 0.15)"
            color="red.300"
            border="1px solid"
            borderColor="rgba(220, 38, 38, 0.25)"
            borderRadius="lg"
            onClick={handleSearch}
            isLoading={isLoading}
            loadingText="Scanning..."
            isDisabled={!addressInput.trim()}
            aria-label="Search for callouts from this address"
            _hover={{
              bg: 'rgba(220, 38, 38, 0.25)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.12)',
            }}
            _active={{ transform: 'translateY(0)' }}
            _disabled={{
              opacity: 0.4,
              cursor: 'not-allowed',
              _hover: { bg: 'rgba(220, 38, 38, 0.15)', transform: 'none', boxShadow: 'none' },
            }}
            transition="all 0.2s"
          >
            🔍 Scan
          </Button>
        </HStack>
      </Box>

      {/* Error */}
      {error && (
        <Box
          p={4}
          borderRadius="xl"
          bg="rgba(236, 201, 75, 0.06)"
          border="1px solid"
          borderColor="rgba(236, 201, 75, 0.2)"
        >
          <HStack>
            <Text fontSize="sm" color="yellow.300">⚠</Text>
            <Text fontSize="sm" color="yellow.200">{error}</Text>
          </HStack>
        </Box>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <Center py={12}>
          <VStack spacing={3}>
            <Spinner color="red.400" size="lg" thickness="3px" />
            <Text fontSize="sm" color="whiteAlpha.400" fontWeight="600">
              Scanning PulseChain transactions…
            </Text>
          </VStack>
        </Center>
      )}

      {/* Results summary */}
      {!isLoading && searchedAddress && (
        <HStack justify="space-between" px={1}>
          <HStack spacing={2}>
            <Text fontSize="xs" color="whiteAlpha.300">
              Showing callouts from
            </Text>
            <Text fontSize="xs" fontFamily="mono" color="red.300" fontWeight="600">
              {truncateAddress(searchedAddress)}
            </Text>
          </HStack>
          <HStack spacing={3}>
            <Badge
              variant="outline"
              colorScheme="red"
              fontSize="10px"
              fontWeight="700"
              borderRadius="full"
              px={2.5}
            >
              {callouts.length} found
            </Badge>
            <Text fontSize="10px" color="whiteAlpha.200">
              {totalScanned} txs scanned
            </Text>
          </HStack>
        </HStack>
      )}

      {/* Empty state */}
      {!isLoading && searchedAddress && callouts.length === 0 && (
        <Box {...cardStyle} textAlign="center" py={12}>
          <Text fontSize="3xl" mb={3}>
            🔇
          </Text>
          <Text fontSize="md" fontWeight="600" color="whiteAlpha.400" mb={1}>
            No callouts found
          </Text>
          <Text fontSize="sm" color="whiteAlpha.250">
            {totalScanned > 0
              ? `Scanned ${totalScanned} transactions — none contained readable text calldata.`
              : 'No transactions found for this address.'}
          </Text>
          {nextPage && (
            <Button
              mt={4}
              size="sm"
              variant="ghost"
              color="whiteAlpha.400"
              onClick={handleLoadMore}
              isLoading={isLoadingMore}
              _hover={{ color: 'red.300' }}
            >
              Scan more transactions →
            </Button>
          )}
        </Box>
      )}

      {/* Initial empty state (no search yet) */}
      {!isLoading && !searchedAddress && (
        <Box {...cardStyle} textAlign="center" py={12}>
          <Text fontSize="3xl" mb={3}>
            📡
          </Text>
          <Text fontSize="md" fontWeight="600" color="whiteAlpha.400" mb={1}>
            Search for callouts
          </Text>
          <Text fontSize="sm" color="whiteAlpha.250">
            Enter an address to see the callout messages it has sent.
          </Text>
        </Box>
      )}

      {/* Callout cards */}
      {callouts.map((callout, index) => (
        <CalloutCard key={callout.id} callout={callout} index={index} />
      ))}

      {/* Load more button */}
      {!isLoading && callouts.length > 0 && nextPage && (
        <Button
          size="lg"
          width="full"
          h="48px"
          fontSize="sm"
          fontWeight="700"
          letterSpacing="0.03em"
          bg="rgba(255, 255, 255, 0.03)"
          color="whiteAlpha.400"
          border="1px solid"
          borderColor="whiteAlpha.50"
          borderRadius="xl"
          onClick={handleLoadMore}
          isLoading={isLoadingMore}
          loadingText="Loading more…"
          _hover={{
            bg: 'rgba(220, 38, 38, 0.08)',
            color: 'red.300',
            borderColor: 'rgba(220, 38, 38, 0.2)',
          }}
          transition="all 0.2s"
        >
          <HStack spacing={2}>
            <Text>Load more callouts</Text>
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg="red.400"
              animation={`${pulseGlow} 2s ease-in-out infinite`}
            />
          </HStack>
        </Button>
      )}
    </VStack>
  )
}
