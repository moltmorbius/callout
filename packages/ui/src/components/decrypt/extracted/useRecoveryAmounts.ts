import { useMemo } from 'react'
import { formatUnits, formatEther, type Address } from 'viem'
import { type ParsedTransaction, type TransferEvent } from '../../../services/transactionParser'
import { type ExtractedTemplateData } from '../../../utils/templateExtraction'

export interface RecoveryAmount {
  token: TransferEvent['token']
  amount: string
  formattedAmount: string
  type: TransferEvent['type']
}

/**
 * Hook to calculate recovery amounts based on percentage and transfers.
 * Only counts transfers TO the scammer and calculates the recovery percentage.
 */
export function useRecoveryAmounts(
  parsedTransaction: ParsedTransaction | null,
  extractedData: ExtractedTemplateData | null
): RecoveryAmount[] {
  return useMemo(() => {
    if (!parsedTransaction || !extractedData?.recoveryPercentage || !extractedData?.receiveAddress) {
      return []
    }

    const percentage = extractedData.recoveryPercentage / 100
    const recoveryAmounts: RecoveryAmount[] = []

    // Only count transfers where scammer is the recipient
    const scammerAddress = parsedTransaction.scammer?.toLowerCase()
    if (!scammerAddress) return []

    // Group transfers by token (only transfers TO the scammer)
    const transfersByToken = new Map<string, TransferEvent[]>()
    for (const transfer of parsedTransaction.transfers) {
      // Skip NFTs for now (focus on fungible tokens)
      if (transfer.type === 'erc721' || transfer.type === 'erc1155') continue

      // Only count transfers TO the scammer
      if (transfer.to.toLowerCase() !== scammerAddress) continue

      const tokenKey = transfer.token?.address || 'native'
      if (!transfersByToken.has(tokenKey)) {
        transfersByToken.set(tokenKey, [])
      }
      transfersByToken.get(tokenKey)!.push(transfer)
    }

    // Calculate recovery amount for each token type
    for (const [tokenKey, transfers] of transfersByToken.entries()) {
      // Sum up all transfer values for this token (that went to scammer)
      let totalAmount = BigInt(0)
      let tokenInfo = transfers[0]?.token

      for (const transfer of transfers) {
        try {
          totalAmount += BigInt(transfer.value)
        } catch {
          // Skip invalid values
        }
      }

      if (totalAmount > 0n) {
        // Calculate recovery amount (percentage of total)
        const recoveryAmount = (totalAmount * BigInt(Math.floor(percentage * 10000))) / BigInt(10000)

        // Format the amount - preserve full precision, no rounding
        let formattedAmount: string
        try {
          const decimals = tokenInfo?.decimals ?? (tokenKey === 'native' ? 18 : 18)
          formattedAmount = tokenKey === 'native'
            ? formatEther(recoveryAmount)
            : formatUnits(recoveryAmount, decimals)
        } catch {
          formattedAmount = recoveryAmount.toString()
        }

        recoveryAmounts.push({
          token: tokenInfo || {
            symbol: tokenKey === 'native' ? 'ETH' : 'UNKNOWN',
            name: tokenKey === 'native' ? 'Ethereum' : 'Unknown Token',
            address: tokenKey === 'native' ? null : (tokenKey as Address),
            decimals: tokenKey === 'native' ? 18 : 18,
          },
          amount: recoveryAmount.toString(),
          formattedAmount,
          type: tokenKey === 'native' ? 'native' : 'erc20',
        })
      }
    }

    return recoveryAmounts
  }, [parsedTransaction, extractedData?.recoveryPercentage, extractedData?.receiveAddress])
}
