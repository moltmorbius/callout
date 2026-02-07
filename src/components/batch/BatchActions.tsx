import { VStack, HStack, Text, Button, Flex } from '@chakra-ui/react'
import { useState, useMemo, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useThemeBgColor, useThemeTextColor } from '../../shared/useThemeColors'
import { boxShadows, getThemeValue, borderRadius } from '../../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { type Address, type Hex } from 'viem'
import { type BatchRow } from './types'
import { CalldataPreview } from '../../shared/CalldataPreview'

interface BatchActionsProps {
  rows: BatchRow[]
  isConnected: boolean
  processing: boolean
  onSignAll: () => void
  onSendAll: () => void
  getCalldataForRow: (row: BatchRow) => Hex | null
  recoverAddressFromSignature: (row: BatchRow) => Promise<Address | null>
}

export function BatchActions({ rows, isConnected, processing, onSignAll, onSendAll, getCalldataForRow, recoverAddressFromSignature }: BatchActionsProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  const cardBg = useThemeBgColor('card')
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null)
  const [recoveredAddresses, setRecoveredAddresses] = useState<Map<string, Address | null>>(new Map())
  // const { address: walletAddress } = useAccount()

  const totalCount = rows.length
  const pendingCount = rows.filter((r) => r.status === 'pending').length
  const signedCount = rows.filter((r) => r.status === 'signed').length
  const sentCount = rows.filter((r) => r.status === 'sent').length
  const errorCount = rows.filter((r) => r.status === 'error').length

  // Get signed rows that will be sent, and check if wallet addresses don't match
  const signedRowsToSend = useMemo(() => {
    return rows.filter((r) => r.status === 'signed')
  }, [rows])

  // // Check if any row has a different wallet address (which is expected in batch mode)
  // const hasWalletMismatch = useMemo(() => {
  //   if (!walletAddress) return false
  //   return signedRowsToSend.some((row) => row.address.toLowerCase() !== walletAddress.toLowerCase())
  // }, [signedRowsToSend, walletAddress])

  // Get unique calldata previews (group by calldata to avoid duplicates)
  const calldataPreviews = useMemo(() => {
    const previews = new Map<string, { calldata: Hex; row: BatchRow }>()
    for (const row of signedRowsToSend) {
      const calldata = getCalldataForRow(row)
      if (calldata && !previews.has(calldata)) {
        previews.set(calldata, { calldata, row })
      }
    }
    return Array.from(previews.values())
  }, [signedRowsToSend, getCalldataForRow])

  // Recover addresses from signatures when rows change
  useEffect(() => {
    const recoverAddresses = async () => {
      const newRecovered = new Map<string, Address | null>()
      for (const row of signedRowsToSend) {
        if (row.signature && row.message) {
          const key = `${row.address}-${row.signature.slice(0, 10)}`
          if (!recoveredAddresses.has(key)) {
            const recovered = await recoverAddressFromSignature(row)
            newRecovered.set(key, recovered)
          } else {
            newRecovered.set(key, recoveredAddresses.get(key)!)
          }
        }
      }
      if (newRecovered.size > 0) {
        setRecoveredAddresses(prev => new Map([...prev, ...newRecovered]))
      }
    }
    recoverAddresses()
  }, [signedRowsToSend, recoverAddressFromSignature])

  const statuses = [
    {
      key: 'pending',
      label: 'Pending',
      count: pendingCount,
      color: 'yellow.400',
      icon: 'mdi:clock-outline',
    },
    {
      key: 'signed',
      label: 'Signed',
      count: signedCount,
      color: 'purple.400',
      icon: 'mdi:check-circle-outline',
    },
    {
      key: 'sent',
      label: 'Sent',
      count: sentCount,
      color: 'green.400',
      icon: 'mdi:send',
    },
    {
      key: 'error',
      label: 'Errors',
      count: errorCount,
      color: 'red.400',
      icon: 'mdi:alert-circle-outline',
    },
  ]

  const boxShadowValue = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )

  return (
    <VStack align="stretch" spacing={4}>
      <HStack px={4}>
        <Button
          colorScheme="purple"
          isLoading={processing}
          onClick={onSignAll}
          isDisabled={pendingCount === 0}
        >
          🔏 Sign All ({pendingCount})
        </Button>
        <Button
          colorScheme="red"
          isLoading={processing}
          onClick={onSendAll}
          isDisabled={!isConnected || signedCount === 0}
        >
          ⚠️ Send ({signedCount})
        </Button>
      </HStack>

      {/* Show calldata previews when wallet addresses don't match (batch mode) */}
      {/* {signedCount > 0 && calldataPreviews.length > 0 && ( */}
        <VStack align="stretch" spacing={0} px={0} boxShadow={boxShadowValue}>
          {/* <Text fontSize="xs" color={useColorModeValue('orange.600', 'orange.400')} fontWeight="600">
            ⚠️ Wallet Address Mismatch Detected
          </Text>
          <Text fontSize="xs" color={textVeryMuted} lineHeight="1.6">
            Transactions will be sent from your connected wallet ({walletAddress?.slice(0, 10)}...), but messages are signed by victim addresses. Verify the calldata below before signing:
          </Text> */}
        {signedCount > 0 && calldataPreviews.length > 0 && (
          calldataPreviews.map(({ calldata, row }, idx) => {
            const key = `${row.address}-${row.signature?.slice(0, 10) || ''}`
            const recoveredAddress = recoveredAddresses.get(key) ?? null
            const addressMatches = recoveredAddress && recoveredAddress.toLowerCase() === row.address.toLowerCase()
            const verificationStatus = recoveredAddress
              ? (addressMatches ? 'verified' : 'error')
              : null
            const label = `Preview ${idx + 1} (Victim: ${row.address.slice(0, 10)}...)`

            return (
              <CalldataPreview
                key={`${row.address}-${idx}`}
                hexCalldata={calldata}
                label={label}
                defaultExpanded={calldataPreviews.length === 1}
                verificationStatus={verificationStatus}
              />
            )
          })
          )}
      <Flex
        h="60px"
        py={2}
        gap={0}
        bg={cardBg}
        borderRadius={borderRadius.none}
        border="none"
        boxShadow={boxShadowValue}
        overflow="hidden"
      >
        {statuses.map((status) => {
          const isHovered = hoveredStatus === status.key
          // const isOtherHovered = hoveredStatus !== null && hoveredStatus !== status.key

          return (
            <Flex
              key={status.key}
              // flex={isHovered ? '0 0 50%' : isOtherHovered ? '0 0 calc(100% / 6)' : '1 1 0'}
              flex="1 1 0"
              align="center"
              justify="center"
              direction="row"
              gap={2}
              px={2}
              cursor="pointer"
              borderRight="1px solid"
              borderColor={textVeryMuted}
              _last={{
                borderRight: 'none',
              }}
              // transition="flex 0.1s ease"
              onMouseEnter={() => setHoveredStatus(status.key)}
              onMouseLeave={() => setHoveredStatus(null)}
              onClick={() => setHoveredStatus(hoveredStatus === status.key ? null : status.key)}
            >
              <Icon icon={status.icon} width="20px" height="20px" color={status.color} />
              <HStack spacing={4} align="start">
                <Text fontSize="xs" color={status.color} fontWeight="600" whiteSpace="nowrap">
                  {status.count}/{totalCount}
                </Text>
                {isHovered && (
                  <Text fontSize="xs" color={textVeryMuted} fontWeight="600" whiteSpace="nowrap">
                    {status.label}
                  </Text>
                )}
              </HStack>
            </Flex>
          )
        })}
      </Flex>
        </VStack>
      {/* )} */}

    </VStack>
  )
}
