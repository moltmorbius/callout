import { Box, VStack, HStack, Text, Code, Divider } from '@chakra-ui/react'
import { formatUnits, formatEther } from 'viem'
import { useThemeBgColor, useThemeTextColor, useAccentTextColor } from '../../../shared/useThemeColors'
import { ChainIcon } from '../../../shared/ChainIcon'
import { TokenIcon } from '../../../shared/TokenIcon'
import { type ParsedTransaction } from '../../../services/transactionParser'

interface TransferTraceProps {
  parsedTransaction: ParsedTransaction
  effectiveChainId: number
}

/**
 * Displays the transfer trace from a parsed transaction.
 * Shows all native and ERC20 transfers with amounts, tokens, and addresses.
 */
export function TransferTrace({ parsedTransaction, effectiveChainId }: TransferTraceProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  const inputBg = useThemeBgColor('input')
  const blueLight = useAccentTextColor('blueLight')
  const redLight = useAccentTextColor('redLight')
  const greenLight = useAccentTextColor('greenLight')
  const dividerColor = useThemeBgColor('borderOverlaySubtle')

  if (!parsedTransaction.transfers.length) {
    return null
  }

  const truncateAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

  return (
    <Box px={0}>
      <Text fontSize="xs" fontWeight="700" color={greenLight} mb={1} px={4} pt={1.5}>
        ✓ Transaction Parsed
      </Text>
      <VStack align="stretch" spacing={1} px={0} pb={1.5}>
        {parsedTransaction.transfers
          .filter(t => t.type === 'native' || t.type === 'erc20')
          .map((transfer, index) => {
            const formattedAmount = (() => {
              try {
                const decimals = transfer.token?.decimals ?? (transfer.type === 'native' ? 18 : 18)
                return transfer.type === 'native'
                  ? formatEther(BigInt(transfer.value))
                  : formatUnits(BigInt(transfer.value), decimals)
              } catch {
                return transfer.value
              }
            })()
            const tokenSymbol = transfer.token?.symbol || 'ETH'

            return (
              <HStack key={index} spacing={2} align="center" px={4} py={1.5}>
                <ChainIcon chainId={effectiveChainId} w="20px" h="20px" />
                <Code fontSize="xs" bg={inputBg} color={blueLight} fontFamily="mono" px={2} py={0.5}>
                  {truncateAddr(transfer.from)}
                </Code>
                <Text fontSize="xs" color={blueLight} fontFamily="mono" fontWeight="600">
                  {formattedAmount}
                </Text>
                <HStack spacing={1} align="center">
                  {transfer.type === 'native' ? (
                    <ChainIcon chainId={effectiveChainId} w="16px" h="16px" />
                  ) : (
                    <TokenIcon
                      chainId={effectiveChainId}
                      tokenAddress={transfer.token?.address ?? null}
                      tokenSymbol={tokenSymbol}
                      w="16px"
                      h="16px"
                    />
                  )}
                  <Text fontSize="xs" color={blueLight} fontWeight="600">
                    {tokenSymbol}
                  </Text>
                </HStack>
                <Text fontSize="xs" color={textVeryMuted}>→</Text>
                <Code fontSize="xs" bg={inputBg} color={redLight} fontFamily="mono" px={2} py={0.5}>
                  {truncateAddr(transfer.to)}
                </Code>
              </HStack>
            )
          })}
      </VStack>
    </Box>
  )
}
