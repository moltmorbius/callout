import { useState, useCallback } from 'react'
import {
  fetchAddressTransactions,
  transactionsToCallouts,
  type BlockScoutNextPage,
} from '../../services/explorer'
import type { Callout } from '@callout/shared/types'
import { classifyError, withRetry } from '@callout/shared/errors'
import { validateAddress } from '@callout/shared/validation'

/**
 * Hook for managing message feed state and operations.
 * Handles address search, pagination, and error states.
 */
export function useMessageFeed() {
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

      errorContext.log( 'MessageFeed.handleSearch')

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

      errorContext.log( 'MessageFeed.handleLoadMore')

      setError(`${errorContext.userMessage}: ${errorContext.actionableSteps.join(' • ')}`)
    } finally {
      setIsLoadingMore(false)
    }
  }, [searchedAddress, nextPage])

  return {
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
  }
}
