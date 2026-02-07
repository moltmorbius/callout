import { useState, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Select,
  Code,
  Link,
  Divider,
  Badge,
  useToast,
} from '@chakra-ui/react'
import { parseTheftTransaction, type ParsedTransaction } from '../services/transactionParser'
import { useCardStyle } from '../shared/styles'
import { useThemeTextColor, useThemeBgColor, useAccentBgColor, useAccentBorderColor, useAccentTextColor } from '../shared/useThemeColors'
import { SectionLabel } from '../shared/SectionLabel'
import { borderRadius, boxShadows, getThemeValue } from '../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { getExplorerTxUrl, getExplorerAddressUrl } from '../config/web3'
import { CHAIN_INFO } from '@callout/shared/types'
import { formatTokenAmount } from '@callout/shared/formatting'
import { TokenIcon } from '../shared/TokenIcon'
import { ChainIcon } from '../shared/ChainIcon'

/**
 * Component for parsing transaction data given a chain ID and transaction hash.
 * Displays parsed transfers, victim/scammer addresses, and transaction details.
 */
export function TransactionParser() {
  const [chainId, setChainId] = useState<string>('1')
  const [txHash, setTxHash] = useState<string>('')
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const cardStyleContainer = useCardStyle(true)
  const textMuted = useThemeTextColor('muted')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const cardBg = useThemeBgColor('card')
  const inputBg = useThemeBgColor('input')
  const errorBg = useAccentBgColor('red', 'bg')
  const errorBorder = useAccentBorderColor('red', 'border')
  const errorTextLight = useAccentTextColor('redLight')

  const boxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )

  const dividerColor = useThemeBgColor('borderOverlaySubtle')
  const errorBorderShadow = `0 0 0 1px ${errorBorder}`

  /**
   * Validates transaction hash format (0x followed by 64 hex characters)
   */
  const isValidTxHash = useCallback((hash: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash)
  }, [])

  /**
   * Handles parsing the transaction
   */
  const handleParse = useCallback(async () => {
    if (!txHash.trim()) {
      setError('Transaction hash is required')
      return
    }

    if (!isValidTxHash(txHash.trim())) {
      setError('Invalid transaction hash format. Must be 0x followed by 64 hex characters.')
      return
    }

    const chainIdNum = parseInt(chainId, 10)
    if (isNaN(chainIdNum) || chainIdNum <= 0) {
      setError('Invalid chain ID')
      return
    }

    setIsLoading(true)
    setError(null)
    setParsedData(null)

    try {
      const result = await parseTheftTransaction(txHash.trim(), chainIdNum)
      setParsedData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse transaction'
      setError(errorMessage)
      toast({
        title: 'Parse Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }, [txHash, chainId, isValidTxHash, toast])


  /**
   * Gets chain name from chain ID
   */
  const chainName = CHAIN_INFO[parseInt(chainId, 10)]?.name || `Chain ${chainId}`

  return (
    <VStack spacing={4} align="stretch">
      {/* Input Section */}
      <Box {...cardStyleContainer}>
        <VStack spacing={4} align="stretch">
          <SectionLabel icon="🔍" label="Parse Transaction" />

          <VStack spacing={3} align="stretch">
            <HStack spacing={3} align="flex-end">
              <Box flex={1}>
                <Text fontSize="xs" color={textVeryMuted} fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" mb={2}>
                  Chain ID
                </Text>
                <Select
                  value={chainId}
                  onChange={(e) => setChainId(e.target.value)}
                  bg={inputBg}
                  border="none"
                  boxShadow={boxShadow}
                  borderRadius={borderRadius.none}
                  fontSize="sm"
                >
                  {Object.entries(CHAIN_INFO).map(([id, info]) => (
                    <option key={id} value={id}>
                      {info.name} ({id})
                    </option>
                  ))}
                </Select>
              </Box>

              <Box flex={2}>
                <Text fontSize="xs" color={textVeryMuted} fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" mb={2}>
                  Transaction Hash
                </Text>
                <Input
                  value={txHash}
                  onChange={(e) => {
                    setTxHash(e.target.value)
                    setError(null)
                  }}
                  placeholder="0x..."
                  bg={inputBg}
                  border="none"
                  boxShadow={boxShadow}
                  borderRadius={borderRadius.none}
                  fontSize="sm"
                  fontFamily="mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleParse()
                    }
                  }}
                />
              </Box>
            </HStack>

            {error && (
              <Box
                bg={errorBg}
                p={3}
                borderRadius={borderRadius.none}
                border="none"
                boxShadow={errorBorderShadow}
              >
                <Text fontSize="sm" color={errorTextLight}>
                  {error}
                </Text>
              </Box>
            )}

            <Button
              onClick={handleParse}
              isLoading={isLoading}
              loadingText="Parsing..."
              colorScheme="orange"
              size="md"
              borderRadius={borderRadius.none}
              fontWeight="700"
              fontSize="sm"
              letterSpacing="0.02em"
            >
              Parse Transaction
            </Button>
          </VStack>
        </VStack>
      </Box>

      {/* Results Section */}
      {parsedData && (
        <Box {...cardStyleContainer}>
          <VStack spacing={4} align="stretch">
              <SectionLabel icon="📄" label="Transaction Details" />

            <VStack spacing={3} align="stretch">
              {/* Transaction Hash */}
              <Box>
                <Text fontSize="xs" color={textVeryMuted} fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" mb={1}>
                  Transaction Hash
                </Text>
                <HStack spacing={2}>
                  <Code fontSize="xs" bg={inputBg} px={2} py={1} borderRadius={borderRadius.none}>
                    {parsedData.txHash}
                  </Code>
                  <Link
                    href={getExplorerTxUrl(parsedData.chainId, parsedData.txHash)}
                    isExternal
                    fontSize="xs"
                    color={textMuted}
                    _hover={{ color: 'orange.400' }}
                  >
                    View on Explorer →
                  </Link>
                </HStack>
              </Box>

              {/* Chain */}
              <Box>
                <Text fontSize="xs" color={textVeryMuted} fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" mb={1}>
                  Chain
                </Text>
                <Badge colorScheme="orange" fontSize="xs" borderRadius={borderRadius.none} px={2} py={1}>
                  {chainName} ({parsedData.chainId})
                </Badge>
              </Box>

              <Divider borderColor={dividerColor} />

              {/* Victim */}
              {parsedData.victim && (
                <Box>
                  <Text fontSize="xs" color={textVeryMuted} fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" mb={1}>
                    Victim
                  </Text>
                  <HStack spacing={2}>
                    <Code fontSize="xs" bg={inputBg} px={2} py={1} borderRadius={borderRadius.none}>
                      {parsedData.victim}
                    </Code>
                    <Link
                      href={getExplorerAddressUrl(parsedData.chainId, parsedData.victim)}
                      isExternal
                      fontSize="xs"
                      color={textMuted}
                      _hover={{ color: 'orange.400' }}
                    >
                      View →
                    </Link>
                  </HStack>
                </Box>
              )}

              {/* Scammer */}
              {parsedData.scammer && (
                <Box>
                  <Text fontSize="xs" color={textVeryMuted} fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" mb={1}>
                    Scammer
                  </Text>
                  <HStack spacing={2}>
                    <Code fontSize="xs" bg={inputBg} px={2} py={1} borderRadius={borderRadius.none}>
                      {parsedData.scammer}
                    </Code>
                    <Link
                      href={getExplorerAddressUrl(parsedData.chainId, parsedData.scammer)}
                      isExternal
                      fontSize="xs"
                      color={textMuted}
                      _hover={{ color: 'orange.400' }}
                    >
                      View →
                    </Link>
                  </HStack>
                </Box>
              )}

              {/* Transfers */}
              {parsedData.transfers.length > 0 && (
                <>
                  <Divider borderColor={dividerColor} />
                  <Box>
                    <Text fontSize="xs" color={textVeryMuted} fontWeight="700" letterSpacing="0.05em" textTransform="uppercase" mb={2}>
                      Transfers ({parsedData.transfers.length})
                    </Text>
                    <VStack spacing={3} align="stretch">
                      {parsedData.transfers.map((transfer, index) => (
                        <Box
                          key={index}
                          bg={inputBg}
                          p={3}
                          borderRadius={borderRadius.none}
                          border="1px solid"
                          borderColor={dividerColor}
                        >
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Badge
                                colorScheme={
                                  transfer.type === 'native' ? 'orange' :
                                  transfer.type === 'erc20' ? 'blue' :
                                  transfer.type === 'erc721' ? 'purple' :
                                  'green'
                                }
                                fontSize="xs"
                                borderRadius={borderRadius.none}
                                px={2}
                                py={0.5}
                              >
                                {transfer.type?.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                              {transfer.tokenId && (
                                <Text fontSize="xs" color={textMuted}>
                                  Token ID: {transfer.tokenId}
                                </Text>
                              )}
                            </HStack>

                            <Box>
                              <Text fontSize="xs" color={textVeryMuted} mb={1}>
                                From
                              </Text>
                              <Code fontSize="xs" bg={cardBg} px={2} py={1} borderRadius={borderRadius.none}>
                                {transfer.from}
                              </Code>
                            </Box>

                            <Box>
                              <Text fontSize="xs" color={textVeryMuted} mb={1}>
                                To
                              </Text>
                              <Code fontSize="xs" bg={cardBg} px={2} py={1} borderRadius={borderRadius.none}>
                                {transfer.to}
                              </Code>
                            </Box>

                            <Box>
                              <Text fontSize="xs" color={textVeryMuted} mb={1}>
                                {transfer.type === 'erc721' || transfer.type === 'erc1155' ? 'Token ID' : 'Amount'}
                              </Text>
                              <HStack spacing={2}>
                                <Text fontSize="sm" fontWeight="600">
                                  {formatTokenAmount(transfer.value, transfer.token?.decimals, transfer.type)}
                                </Text>
                                <HStack spacing={1} align="center">
                                  {transfer.type === 'native' ? (
                                    <ChainIcon chainId={parsedData.chainId} w="16px" h="16px" />
                                  ) : (
                                    <TokenIcon
                                      chainId={parsedData.chainId}
                                      tokenAddress={transfer.token?.address ?? null}
                                      tokenSymbol={transfer.token?.symbol}
                                      w="16px"
                                      h="16px"
                                    />
                                  )}
                                  <Text fontSize="xs" color={textMuted}>
                                    {transfer.token?.symbol ?? (transfer.type === 'native' ? 'ETH' : '')}
                                  </Text>
                                </HStack>
                              </HStack>
                            </Box>

                            {transfer.token?.address && (
                              <Box>
                                <Text fontSize="xs" color={textVeryMuted} mb={1}>
                                  Token Address
                                </Text>
                                <HStack spacing={2}>
                                  <Code fontSize="xs" bg={cardBg} px={2} py={1} borderRadius={borderRadius.none}>
                                    {transfer.token.address}
                                  </Code>
                                  <Link
                                    href={getExplorerAddressUrl(parsedData.chainId, transfer.token.address)}
                                    isExternal
                                    fontSize="xs"
                                    color={textMuted}
                                    _hover={{ color: 'orange.400' }}
                                  >
                                    View →
                                  </Link>
                                </HStack>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </>
              )}

              {parsedData.transfers.length === 0 && (
                <Text fontSize="sm" color={textMuted} fontStyle="italic">
                  No transfers found in this transaction.
                </Text>
              )}
            </VStack>
          </VStack>
        </Box>
      )}
    </VStack>
  )
}
