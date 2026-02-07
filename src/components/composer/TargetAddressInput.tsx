import { Box, VStack, HStack, Text, Input, InputGroup, InputLeftElement, Button, Code } from '@chakra-ui/react'
import { useState } from 'react'
import { isAddress } from 'viem'
import { keyframes } from '@emotion/react'
import { useCardStyle } from '../../shared/styles'
import { SectionLabel } from '../../shared/SectionLabel'
import { borderRadius, boxShadows, getThemeValue } from '../../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { useThemeTextColor, useThemeBgColor, useAccentBorderColor, useAccentTextColor, usePurpleMetaColors } from '../../shared/useThemeColors'
import { parseTheftTransaction, type ParsedTransaction } from '../../services/transactionParser'
import { useToast } from '@chakra-ui/react'
import { useChainId } from 'wagmi'

const targetGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.3), 0 0 20px rgba(220, 38, 38, 0.06); }
  50% { box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.5), 0 0 40px rgba(220, 38, 38, 0.12); }
`

interface TargetAddressInputProps {
  value: string
  onChange: (value: string) => void
  onParsed?: (parsed: ParsedTransaction) => void
  /** If true, renders without card wrapper for embedding in another card */
  noCard?: boolean
}

/**
 * Target address input with transaction hash detection and parsing.
 * Automatically detects transaction hashes (66 chars) and offers to parse them.
 */
export function TargetAddressInput({ value, onChange, onParsed, noCard = false }: TargetAddressInputProps) {
  const chainId = useChainId()
  const toast = useToast()
  const cardStyleContainer = useCardStyle(true)
  const [parsedTx, setParsedTx] = useState<ParsedTransaction | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')
  const inputPlaceholder = useThemeTextColor('extraMuted')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const redBorder = useAccentBorderColor('red', 'border')
  const redBorderStrong = useAccentBorderColor('red', 'borderStrong')
  const redFocusShadow = useColorModeValue(
    `0 0 0 1px ${redBorderStrong}, 0 0 30px rgba(220, 38, 38, 0.1)`,
    `0 0 0 1px ${redBorderStrong}, 0 0 30px rgba(220, 38, 38, 0.1)`
  )
  const inputBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderInput, 'light'),
    getThemeValue(boxShadows.borderInput, 'dark')
  )
  const accentBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderAccent, 'light'),
    getThemeValue(boxShadows.borderAccent, 'dark')
  )
  const purpleMeta = usePurpleMetaColors()
  const redText = useAccentTextColor('red')
  const purpleText = useAccentTextColor('purple')
  const purpleTextLight = useAccentTextColor('purpleLight')
  const greenText = useAccentTextColor('green')
  const orangeText = useAccentTextColor('orange')

  const isValidTarget = value ? isAddress(value) : false

  const handleParseTx = async () => {
    const hashToParse = value.trim()
    if (!hashToParse) {
      toast({
        title: 'Enter transaction hash',
        description: 'Paste the theft transaction hash to analyze',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setIsParsing(true)
    setParsedTx(null)

    try {
      const parsed = await parseTheftTransaction(hashToParse, chainId)
      setParsedTx(parsed)
      onParsed?.(parsed)
      toast({
        title: 'Transaction Parsed ✓',
        description: `Identified ${parsed.transfers.length} transfers. Victim: ${parsed.victim?.slice(0, 10)}..., Scammer: ${parsed.scammer?.slice(0, 10)}...`,
        status: 'success',
        duration: 5000,
      })
    } catch (err: unknown) {
      const error = err as Error
      console.error('Parse error:', err)
      toast({
        title: 'Parse Failed',
        description: error.message || 'Could not parse transaction. Check the hash and network.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsParsing(false)
    }
  }

  const content = (
    <>
      {!noCard && <SectionLabel icon="🎯" label="Target Address or Transaction Hash" accent={redText} />}
      <InputGroup size="md">
        <InputLeftElement pointerEvents="none" h="full" pl={1}>
          <Text color={redText} fontSize="xs" fontFamily="mono" fontWeight="700">0x</Text>
        </InputLeftElement>
        <Input
          placeholder="Paste address or transaction hash..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            // Clear parsed data when user changes input
            if (parsedTx) setParsedTx(null)
          }}
          aria-label="Target wallet address or transaction hash"
          fontFamily="mono" fontSize="sm"
          bg={inputBg} pl="42px" h="40px"
          color={inputText}
          border="none"
          boxShadow={value ? (isValidTarget ? `0 0 0 1px ${redBorderStrong}` : '0 0 0 1px var(--chakra-colors-orange-500)') : inputBorderShadow}
          borderRadius={borderRadius.none}
          _hover={{ boxShadow: `0 0 0 1px ${redBorder}` }}
          _focus={{
            boxShadow: redFocusShadow,
          }}
          _placeholder={{ color: inputPlaceholder }}
        />
      </InputGroup>

      {/* Smart detection and parsing */}
      {value && value.length === 66 && !parsedTx && (
        <VStack align="stretch" spacing={2} mt={3}>
          <HStack spacing={2}>
            <Text fontSize="xs" color={purpleText} fontWeight="600">
              🔍 Transaction hash detected
            </Text>
          </HStack>
          <Button
            size="sm"
            colorScheme="purple"
            onClick={handleParseTx}
            isLoading={isParsing}
            loadingText="Analyzing..."
          >
            Parse Transaction & Auto-Fill
          </Button>
        </VStack>
      )}

      {/* Parsed result */}
      {parsedTx && (
        <Box mt={3} p={3} bg={purpleMeta.bg} borderRadius={borderRadius.none} border="none" boxShadow={purpleMeta.borderShadow}>
          <VStack align="stretch" spacing={2}>
            <HStack>
              <Text fontSize="xs" fontWeight="700" color={purpleTextLight}>
                ✓ Transaction Parsed
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color={textVeryMuted}>Victim:</Text>
              <Code fontSize="xs" color={purpleTextLight}>{parsedTx.victim?.slice(0, 20)}...</Code>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color={textVeryMuted}>Scammer:</Text>
              <Code fontSize="xs" color={purpleTextLight}>{parsedTx.scammer?.slice(0, 20)}...</Code>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color={textVeryMuted}>Transfers:</Text>
              <Text fontSize="xs" color={purpleTextLight} fontWeight="600">{parsedTx.transfers.length}</Text>
            </HStack>
            <Text fontSize="xs" color={greenText} fontWeight="600" pt={1}>
              → Target set to scammer, template fields auto-filled
            </Text>
          </VStack>
        </Box>
      )}

      {value && !isValidTarget && value.length !== 66 && (
        <Text fontSize="xs" color={orangeText} mt={2} fontWeight="600">⚠ Invalid address format</Text>
      )}
      {isValidTarget && !parsedTx && (
        <HStack mt={2} spacing={1.5}>
          <Box w="6px" h="6px" borderRadius="full" bg={redText} />
          <Text fontSize="xs" color={redText} fontWeight="700" letterSpacing="0.03em">Target locked</Text>
        </HStack>
      )}
    </>
  )

  if (noCard) {
    return <Box flex={1}>{content}</Box>
  }

  return (
    <Box
      {...cardStyleContainer}
      boxShadow={accentBorderShadow}
      position="relative"
      overflow="hidden"
      animation={value && isValidTarget ? `${targetGlow} 3s ease-in-out infinite` : undefined}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '2px',
        bgGradient: 'linear(to-r, transparent, rgba(220,38,38,0.6), transparent)',
      }}
    >
      {content}
    </Box>
  )
}
