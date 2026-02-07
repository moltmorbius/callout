import { Box, VStack, HStack, Text, Code, Link, IconButton, Divider } from '@chakra-ui/react'
import { useState } from 'react'
import { borderRadius, boxShadows, getThemeValue } from '../../../config/themeTokens'
import { useThemeBgColor, useThemeTextColor, useAccentTextColor } from '../../../shared/useThemeColors'
import { useColorModeValue } from '@chakra-ui/react'
import { getExplorerAddressUrl } from '../../../config/web3'
import { ChainIcon } from '../../../shared/ChainIcon'
import { DataRow } from './DataRow'
import { type Address } from 'viem'
import { type ExtractedTemplateData } from '../../../utils/templateExtraction'

interface ExtractedDataBasicInfoProps {
  extractedData: ExtractedTemplateData | null
  recoveredAddress: Address | null | undefined
  addressVerification: {
    matches: boolean
    violatedAddress: string
  } | null
  effectiveChainId: number
}

/**
 * Displays basic extracted information: Chain ID, Transaction Hash, Recovery Address, and Address Recovered.
 */
export function ExtractedDataBasicInfo({
  extractedData,
  recoveredAddress,
  addressVerification,
  effectiveChainId,
}: ExtractedDataBasicInfoProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  const inputBg = useThemeBgColor('input')
  const blueLight = useAccentTextColor('blueLight')
  const greenLight = useAccentTextColor('greenLight')
  const blue = useAccentTextColor('blue')
  const boxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const dividerColor = useThemeBgColor('borderOverlaySubtle')
  const [copied, setCopied] = useState(false)

  if (!extractedData?.theftTxHash && !extractedData?.receiveAddress && !extractedData?.chainId && !recoveredAddress) {
    return null
  }

  return (
    <Box px={0}>
      <VStack align="stretch" spacing={1.5} px={4} py={1.5}>
        {extractedData?.chainId && (
          <HStack justify="space-between" align="center">
            <Text fontSize="xs" color={textVeryMuted} fontWeight="600">
              Chain ID:
            </Text>
            <HStack spacing={2} align="center">
              <ChainIcon chainId={parseInt(extractedData.chainId)} w="16px" h="16px" />
              <Text fontSize="xs" color={blueLight} fontWeight="600">
                {extractedData.chainId}
              </Text>
            </HStack>
          </HStack>
        )}
        {extractedData?.theftTxHash && (
          <DataRow
            label="Transaction Hash"
            value={extractedData.theftTxHash}
            isAddress={false}
            isTxHash={true}
            chainId={effectiveChainId}
          />
        )}
        {extractedData?.receiveAddress && (
          <DataRow
            label="Recovery Address"
            value={extractedData.receiveAddress}
            isAddress={true}
            chainId={effectiveChainId}
          />
        )}
        {recoveredAddress && (
          <HStack justify="space-between" align="center">
            <HStack spacing={2} align="center">
              <Text fontSize="xs" color={textVeryMuted} fontWeight="600">
                Address Recovered:
              </Text>
              {addressVerification && (
                <HStack spacing={1} align="center">
                  <Text fontSize="xs" color={addressVerification.matches ? greenLight : textVeryMuted}>
                    {addressVerification.matches ? '✓' : '✗'}
                  </Text>
                  <Text fontSize="10px" color={addressVerification.matches ? greenLight : textVeryMuted} fontWeight="600">
                    {addressVerification.matches ? 'Matches violated address' : 'Does not match violated address'}
                  </Text>
                </HStack>
              )}
            </HStack>
            <HStack spacing={2} align="center">
              <Code
                fontSize="xs"
                bg={inputBg}
                color={addressVerification?.matches ? greenLight : blueLight}
                fontFamily="mono"
                px={2}
                py={0.5}
                borderRadius={borderRadius.none}
                border="none"
                boxShadow={boxShadow}
              >
                {recoveredAddress.length > 20 ? `${recoveredAddress.slice(0, 10)}...${recoveredAddress.slice(-8)}` : recoveredAddress}
              </Code>
              <IconButton
                aria-label="Copy address"
                icon={<Text fontSize="xs">{copied ? '✓' : '📋'}</Text>}
                size="xs"
                variant="ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(recoveredAddress)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {
                    // Ignore clipboard errors
                  }
                }}
                color={blue}
                _hover={{ color: blueLight }}
                minW="auto"
                h="auto"
                p={1}
              />
              <Link
                href={getExplorerAddressUrl(effectiveChainId, recoveredAddress)}
                isExternal
                fontSize="xs"
                color={blue}
                _hover={{ color: blueLight, textDecoration: 'underline' }}
              >
                ↗
              </Link>
            </HStack>
          </HStack>
        )}
      </VStack>
    </Box>
  )
}
