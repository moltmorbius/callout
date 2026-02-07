import { useCallback, useState } from 'react'
import { type Address, encodeFunctionData } from 'viem'
import { useSendTransaction } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { useToast } from '@chakra-ui/react'
import { type RecoveryAmount } from './useRecoveryAmounts'
import { type ExtractedTemplateData } from '../../../utils/templateExtraction'

/**
 * Hook to handle sending recovery transactions.
 * Returns the send handler and the current sending index state.
 */
export function useSendRecovery(extractedData: ExtractedTemplateData | null) {
  const { isConnected } = useAppKitAccount()
  const { mutateAsync: sendTransactionAsync } = useSendTransaction()
  const [sendingIndex, setSendingIndex] = useState<number | null>(null)
  const toast = useToast()

  const handleSendRecovery = useCallback(async (recoveryAmount: RecoveryAmount, index: number) => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to send recovery transactions',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!extractedData?.receiveAddress) {
      toast({
        title: 'Missing Recovery Address',
        description: 'Recovery address is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setSendingIndex(index)
    try {
      const amount = BigInt(recoveryAmount.amount)
      const toAddress = extractedData.receiveAddress as Address

      let txHash: `0x${string}`

      if (recoveryAmount.type === 'native') {
        // Native ETH transfer
        txHash = await sendTransactionAsync({
          to: toAddress,
          value: amount,
        })
      } else {
        // ERC20 token transfer
        // ERC20 transfer function signature: transfer(address to, uint256 amount)
        const transferData = encodeFunctionData({
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }],
            },
          ],
          functionName: 'transfer',
          args: [toAddress, amount],
        })

        const tokenAddress = recoveryAmount.token?.address
        if (!tokenAddress) {
          throw new Error('Token address is required for ERC20 transfers')
        }

        txHash = await sendTransactionAsync({
          to: tokenAddress,
          data: transferData,
          value: BigInt(0),
        })
      }

      toast({
        title: '✓ Recovery Transaction Sent',
        description: `Tx: ${txHash.slice(0, 14)}...`,
        status: 'success',
        duration: 10000,
        isClosable: true,
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send recovery transaction'
      toast({
        title: '⚠️ Transaction Failed',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      })
    } finally {
      setSendingIndex(null)
    }
  }, [isConnected, extractedData?.receiveAddress, sendTransactionAsync, toast])

  return {
    handleSendRecovery,
    sendingIndex,
  }
}
