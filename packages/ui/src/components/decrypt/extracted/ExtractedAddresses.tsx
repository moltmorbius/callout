import { Box, VStack, Divider } from '@chakra-ui/react'
import { useThemeBgColor } from '../../../shared/useThemeColors'
import { DataRow } from './DataRow'
import { type ExtractedTemplateData } from '@callout/shared/templates'

interface ExtractedAddressesProps {
  extractedData: ExtractedTemplateData | null
  effectiveChainId: number
}

/**
 * Displays extracted addresses: Exploited Address, Scammer Address, and Contract Address.
 */
export function ExtractedAddresses({ extractedData, effectiveChainId }: ExtractedAddressesProps) {
  const dividerColor = useThemeBgColor('borderOverlaySubtle')

  if (!extractedData?.exploitedAddress && !extractedData?.scammerAddress && !extractedData?.contractAddress) {
    return null
  }

  return (
    <Box px={0}>
      <VStack align="stretch" spacing={1.5} px={4} py={1.5}>
        {extractedData?.exploitedAddress && (
          <DataRow
            label="Exploited Address"
            value={extractedData.exploitedAddress}
            isAddress={true}
            chainId={effectiveChainId}
          />
        )}
        {extractedData?.scammerAddress && (
          <DataRow
            label="Scammer Address"
            value={extractedData.scammerAddress}
            isAddress={true}
            chainId={effectiveChainId}
          />
        )}
        {extractedData?.contractAddress && (
          <DataRow
            label="Contract Address"
            value={extractedData.contractAddress}
            isAddress={true}
            chainId={effectiveChainId}
          />
        )}
      </VStack>
    </Box>
  )
}
