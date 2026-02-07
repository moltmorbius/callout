import { Box, VStack, Collapse, Divider } from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import { type Address } from 'viem'
import { useThemeBgColor, useAccentBorderColor } from '../../shared/useThemeColors'
import { type ExtractedTemplateData, type MessageTemplate } from '@callout/shared/templates'
import { type ParsedTransaction } from '../../services/transactionParser'
import { parseSignedMessage } from '@callout/shared/crypto'
import { ExtractedDataHeader } from './extracted/ExtractedDataHeader'
import { ExtractedDataBasicInfo } from './extracted/ExtractedDataBasicInfo'
import { TransferTrace } from './extracted/TransferTrace'
import { RecoverySteps } from './extracted/RecoverySteps'
import { ExtractedAddresses } from './extracted/ExtractedAddresses'
import { ExtractedOtherFields } from './extracted/ExtractedOtherFields'
import { useRecoveryAmounts } from './extracted/useRecoveryAmounts'
import { useSendRecovery } from './extracted/useSendRecovery'

interface ExtractedDataProps {
  extractedData: ExtractedTemplateData | null
  parsedTransaction: ParsedTransaction | null
  chainId?: number
  onFetchTransaction?: () => void
  isFetchingTransaction?: boolean
  template?: MessageTemplate | null
  recoveredAddress?: Address | null
  decodedMessage?: string | null
}

/**
 * Component that displays extracted structured data from a decoded template message.
 * Shows template identification, transaction hash, addresses, amounts, and optionally fetched transaction data.
 */
export function ExtractedData({
  extractedData,
  parsedTransaction,
  chainId,
  onFetchTransaction,
  isFetchingTransaction = false,
  template,
  recoveredAddress,
  decodedMessage,
}: ExtractedDataProps) {
  const cardBg = useThemeBgColor('card')
  const blueBorder = useAccentBorderColor('blue', 'border')
  const blueBorderShadow = `0 0 0 1px ${blueBorder}`
  const dividerColor = useThemeBgColor('borderOverlaySubtle')

  const [isExpanded, setIsExpanded] = useState(true)

  const hasData =
    extractedData?.theftTxHash ||
    extractedData?.receiveAddress ||
    extractedData?.exploitedAddress ||
    extractedData?.scammerAddress ||
    extractedData?.amount ||
    extractedData?.tokenName ||
    extractedData?.chainId ||
    extractedData?.deadline ||
    extractedData?.projectName ||
    extractedData?.contractAddress ||
    recoveredAddress

  // Show component if template is identified, even if no data extracted yet
  if (!hasData && !parsedTransaction && !template && !recoveredAddress) {
    return null
  }

  const effectiveChainId = parsedTransaction?.chainId || (extractedData?.chainId ? parseInt(extractedData.chainId) : chainId) || 1

  // Calculate recovery amounts
  const recoveryAmounts = useRecoveryAmounts(parsedTransaction, extractedData)

  // Handle sending recovery transactions
  const { handleSendRecovery, sendingIndex } = useSendRecovery(extractedData)

  // Parse signature from decoded message for tooltip
  const parsedSigned = useMemo(() => {
    if (!decodedMessage) return null
    return parseSignedMessage(decodedMessage)
  }, [decodedMessage])

  // Check if recovered address matches the violated/victim address
  const addressVerification = useMemo(() => {
    if (!recoveredAddress) return null

    const violatedAddress = parsedTransaction?.victim || extractedData?.exploitedAddress
    if (!violatedAddress) return null

    // Compare addresses case-insensitively
    const matches = recoveredAddress.toLowerCase() === violatedAddress.toLowerCase()
    return {
      matches,
      violatedAddress,
    }
  }, [recoveredAddress, parsedTransaction?.victim, extractedData?.exploitedAddress])

  // Determine if we need dividers between sections
  const hasBasicInfo = extractedData?.theftTxHash || extractedData?.receiveAddress || extractedData?.chainId || recoveredAddress
  const hasTransfers = parsedTransaction && parsedTransaction.transfers.length > 0
  const hasRecoverySteps = recoveryAmounts.length > 0
  const hasAddresses = extractedData?.exploitedAddress || extractedData?.scammerAddress || extractedData?.contractAddress
  const hasOtherFields = extractedData?.amount || extractedData?.tokenName || extractedData?.deadline || extractedData?.projectName

  return (
    <Box
      py={1.5}
      px={0}
      bg={cardBg}
      borderRadius="none"
      border="none"
      boxShadow={blueBorderShadow}
    >
      <ExtractedDataHeader
        template={template ?? null}
        parsedSigned={parsedSigned}
        recoveredAddress={recoveredAddress || undefined}
        extractedData={extractedData}
        onFetchTransaction={onFetchTransaction}
        isFetchingTransaction={isFetchingTransaction}
        onToggleExpanded={() => setIsExpanded(!isExpanded)}
        isExpanded={isExpanded}
      />

      <Collapse in={isExpanded} animateOpacity>
        <VStack align="stretch" spacing={0}>
          {/* Basic Info Section */}
          {hasBasicInfo && (
            <>
              <ExtractedDataBasicInfo
                extractedData={extractedData}
                recoveredAddress={recoveredAddress}
                addressVerification={addressVerification}
                effectiveChainId={effectiveChainId}
              />
              {(hasTransfers || hasRecoverySteps || hasAddresses || hasOtherFields) && (
                <Divider borderColor={dividerColor} my={1.5} />
              )}
            </>
          )}

          {/* Transfer Trace Section */}
          {hasTransfers && (
            <>
              <TransferTrace
                parsedTransaction={parsedTransaction!}
                effectiveChainId={effectiveChainId}
              />
              {(hasRecoverySteps || hasAddresses || hasOtherFields) && (
                <Divider borderColor={dividerColor} my={1.5} />
              )}
            </>
          )}

          {/* Recovery Steps Section */}
          {hasRecoverySteps && (
            <>
              <RecoverySteps
                recoveryAmounts={recoveryAmounts}
                extractedData={extractedData}
                parsedTransaction={parsedTransaction!}
                effectiveChainId={effectiveChainId}
                sendingIndex={sendingIndex}
                onSendRecovery={handleSendRecovery}
              />
              {(hasAddresses || hasOtherFields) && (
                <Divider borderColor={dividerColor} my={1.5} />
              )}
            </>
          )}

          {/* Addresses Section */}
          {hasAddresses && (
            <>
              <ExtractedAddresses
                extractedData={extractedData}
                effectiveChainId={effectiveChainId}
              />
              {hasOtherFields && (
                <Divider borderColor={dividerColor} my={1.5} />
              )}
            </>
          )}

          {/* Other Fields Section */}
          {hasOtherFields && (
            <ExtractedOtherFields extractedData={extractedData} />
          )}
        </VStack>
      </Collapse>
    </Box>
  )
}
