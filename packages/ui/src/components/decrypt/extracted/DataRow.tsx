import { HStack, Text, Code, Link, IconButton } from '@chakra-ui/react'
import { useState } from 'react'
import { borderRadius, boxShadows, getThemeValue } from '../../../config/themeTokens'
import { useThemeBgColor, useThemeTextColor, useAccentTextColor } from '../../../shared/useThemeColors'
import { useColorModeValue } from '@chakra-ui/react'
import { getExplorerTxUrl, getExplorerAddressUrl } from '../../../config/web3'

interface DataRowProps {
  label: string
  value: string
  isAddress: boolean
  isTxHash?: boolean
  chainId: number
}

/**
 * Reusable component for displaying a label-value data row.
 * Supports addresses and transaction hashes with copy and explorer link functionality.
 */
export function DataRow({
  label,
  value,
  isAddress,
  isTxHash = false,
  chainId,
}: DataRowProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  const inputBg = useThemeBgColor('input')
  const blue = useAccentTextColor('blue')
  const blueLight = useAccentTextColor('blueLight')
  const boxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const [copied, setCopied] = useState(false)

  const displayValue = value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard errors
    }
  }

  return (
    <HStack justify="space-between" align="center">
      <Text fontSize="xs" color={textVeryMuted} fontWeight="600">
        {label}:
      </Text>
      <HStack spacing={2} align="center">
        <Code
          fontSize="xs"
          bg={inputBg}
          color={blueLight}
          fontFamily="mono"
          px={2}
          py={0.5}
          borderRadius={borderRadius.none}
          border="none"
          boxShadow={boxShadow}
        >
          {displayValue}
        </Code>
        {(isAddress || isTxHash) && (
          <>
            <IconButton
              aria-label={isAddress ? 'Copy address' : 'Copy transaction hash'}
              icon={<Text fontSize="xs">{copied ? '✓' : '📋'}</Text>}
              size="xs"
              variant="ghost"
              onClick={handleCopy}
              color={blue}
              _hover={{ color: blueLight }}
              minW="auto"
              h="auto"
              p={1}
            />
            <Link
              href={isTxHash ? getExplorerTxUrl(chainId, value) : getExplorerAddressUrl(chainId, value)}
              isExternal
              fontSize="xs"
              color={blue}
              _hover={{ color: blueLight, textDecoration: 'underline' }}
            >
              ↗
            </Link>
          </>
        )}
      </HStack>
    </HStack>
  )
}
