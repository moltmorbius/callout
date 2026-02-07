import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useAccount } from 'wagmi'
import { useCardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'
import { colors, boxShadows, getThemeValue } from '../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { useThemeTextColor, useThemeBgColor, useAccentBgColor, useAccentBorderColor, useAccentTextColor, useRedButtonColors, useYellowEncryptedColors } from '../shared/useThemeColors'
import { borderRadius } from '../config/themeTokens'
import { truncateAddress } from '@callout/shared/formatting'
import { CalloutCard } from './feed/CalloutCard'
import { useMessageFeed } from './feed/useMessageFeed'

/* ── Animations ──────────────────────────────────────────────── */

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`

/* ── MessageFeed ─────────────────────────────────────────────── */

export function MessageFeed() {
  const { address: connectedAddress } = useAccount()
  const cardStyleContainer = useCardStyle(true)
  const textSecondary = useThemeTextColor('secondary')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const textExtraMuted = useThemeTextColor('extraMuted')

  // Theme values
  const inputBg = useThemeBgColor('input')
  const inputBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderInput, 'light'),
    getThemeValue(boxShadows.borderInput, 'dark')
  )
  const subtleBg = useColorModeValue('rgba(0, 0, 0, 0.03)', 'rgba(255, 255, 255, 0.03)')
  const redText = useAccentTextColor('red')
  const redFocusBorder = redText
  const redFocusBorderStrong = useAccentBorderColor('red', 'borderStrong')
  const redFocusShadow = `0 0 0 1px ${redFocusBorderStrong}`
  const redButton = useRedButtonColors()
  const yellowEncrypted = useYellowEncryptedColors()
  const cardBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )

  // Use the extracted hook for state management
  const {
    addressInput,
    setAddressInput,
    searchedAddress,
    callouts,
    isLoading,
    isLoadingMore,
    error,
    nextPage,
    totalScanned,
    handleSearch,
    handleLoadMore,
  } = useMessageFeed()

  return (
    <VStack spacing={4} align="stretch" data-testid="message-feed">
      {/* Search header */}
      <Box {...cardStyleContainer}>
        <SectionLabel icon="📋" label="Callout Feed" accent={redText} />
        <Text fontSize="xs" color={textExtraMuted} lineHeight="1.6" mt={1} mb={4}>
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
            color={textExtraMuted}
            letterSpacing="0.02em"
            borderRadius="md"
            onClick={() => setAddressInput(connectedAddress)}
            _hover={{
              color: redButton.text,
              bg: 'transparent',
            }}
            transition="color 0.1s"
          >
            Use My Wallet: {connectedAddress ? truncateAddress(connectedAddress) : ''}
          </Button>
        )}

        {/* Address input */}
        <HStack spacing={2}>
          <InputGroup flex={1}>
            <InputLeftElement h="44px" pointerEvents="none">
              <Text fontSize="sm" color={textExtraMuted}>📤</Text>
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
              bg={inputBg}
              borderColor="transparent"
              boxShadow={inputBorderShadow}
              color={textSecondary}
              _placeholder={{ color: textExtraMuted }}
              _focus={{
                borderColor: redFocusBorder,
                boxShadow: redFocusShadow,
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
            bg={redButton.bg}
            color={redButton.text}
            border="none"
            boxShadow={redButton.borderShadow}
            borderRadius="lg"
            onClick={handleSearch}
            isLoading={isLoading}
            loadingText="Scanning..."
            isDisabled={!addressInput.trim()}
            aria-label="Search for callouts from this address"
            _hover={{
              bg: redButton.hoverBg,
              transform: 'translateY(-1px)',
              boxShadow: `0 0 0 1px ${redFocusBorderStrong}`,
            }}
            _active={{ transform: 'translateY(0)' }}
            _disabled={{
              opacity: 0.4,
              cursor: 'not-allowed',
              _hover: { bg: redButton.bg, transform: 'none', boxShadow: redButton.borderShadow },
            }}
            transition="all 0.1s"
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
          bg={yellowEncrypted.bg}
          border="none"
          boxShadow={yellowEncrypted.borderShadow}
        >
          <HStack>
            <Text fontSize="sm" color={yellowEncrypted.text}>⚠</Text>
            <Text fontSize="sm" color={yellowEncrypted.text}>{error}</Text>
          </HStack>
        </Box>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <Center py={12}>
          <VStack spacing={3}>
            <Spinner color={redFocusBorder} size="lg" thickness="3px" />
            <Text fontSize="sm" color={textVeryMuted} fontWeight="600">
              Scanning PulseChain transactions…
            </Text>
          </VStack>
        </Center>
      )}

      {/* Results summary */}
      {!isLoading && searchedAddress && (
        <HStack justify="space-between" px={1}>
          <HStack spacing={2}>
            <Text fontSize="xs" color={textExtraMuted}>
              Showing callouts from
            </Text>
            <Text fontSize="xs" fontFamily="mono" color={redButtonText} fontWeight="600">
              {searchedAddress ? truncateAddress(searchedAddress) : ''}
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
            <Text fontSize="10px" color={textExtraMuted}>
              {totalScanned} txs scanned
            </Text>
          </HStack>
        </HStack>
      )}

      {/* Empty state */}
      {!isLoading && searchedAddress && callouts.length === 0 && (
        <Box {...cardStyleContainer} textAlign="center" py={12}>
          <Text fontSize="3xl" mb={3}>
            🔇
          </Text>
          <Text fontSize="md" fontWeight="600" color={textVeryMuted} mb={1}>
            No callouts found
          </Text>
          <Text fontSize="sm" color={textExtraMuted}>
            {totalScanned > 0
              ? `Scanned ${totalScanned} transactions — none contained readable text calldata.`
              : 'No transactions found for this address.'}
          </Text>
          {nextPage && (
            <Button
              mt={4}
              size="sm"
              variant="ghost"
                color={textVeryMuted}
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
        <Box {...cardStyleContainer} textAlign="center" py={12}>
          <Text fontSize="3xl" mb={3}>
            📡
          </Text>
          <Text fontSize="md" fontWeight="600" color={textVeryMuted} mb={1}>
            Search for callouts
          </Text>
          <Text fontSize="sm" color={textExtraMuted}>
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
          bg={subtleBg}
          color={textVeryMuted}
          border="none"
          boxShadow={cardBorderShadow}
          borderRadius={borderRadius.none}
          onClick={handleLoadMore}
          isLoading={isLoadingMore}
          loadingText="Loading more…"
          _hover={{
            bg: redButton.bg,
            color: redButton.text,
            borderColor: redButton.borderColor,
          }}
          transition="all 0.1s"
        >
          <HStack spacing={2}>
            <Text>Load more callouts</Text>
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={redFocusBorder}
              animation={`${pulseGlow} 3s ease-in-out infinite`}
            />
          </HStack>
        </Button>
      )}
    </VStack>
  )
}
