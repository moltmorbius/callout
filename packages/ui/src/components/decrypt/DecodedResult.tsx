import { Box, HStack, Text, Collapse, Divider } from '@chakra-ui/react'
import { useCardStyle } from '../../shared/styles'
import { borderRadius } from '../../config/themeTokens'
import { useThemeBgColor, useThemeTextColor, useAccentBgColor, useAccentBorderColor, useAccentGradient, useAccentTextColor, useGreenVerifiedColors } from '../../shared/useThemeColors'
import { useColorModeValue, VStack } from '@chakra-ui/react'
import { getThemeValue, boxShadows } from '../../config/themeTokens'
import { textReveal } from './animations'
import { isEncrypted } from '@callout/shared/encryption'
import { type Address } from 'viem'
import { TransactionMetadata } from './TransactionMetadata'
import { EncryptedPayload } from './EncryptedPayload'
import { DecryptedResult } from './DecryptedResult'
import { ExtractedData } from './ExtractedData'
import { type MessageTemplate, type ExtractedTemplateData } from '@callout/shared/templates'
import { type ParsedTransaction } from '../../services/transactionParser'

interface DecodedResultProps {
  showResult: boolean
  decodedMessage: string | null
  txMeta: {
    from: string
    to: string | null
    chainId: number
    hash: string
  } | null
  recoveredAddress: Address | null
  identifiedTemplate: MessageTemplate | null
  extractedData: ExtractedTemplateData | null
  parsedTransaction: ParsedTransaction | null
  chainId?: number
  onFetchTransaction?: () => void
  isFetchingTransaction?: boolean
  passphrase: string
  onPassphraseChange: (value: string) => void
  onDecrypt: () => void
  isDecrypting: boolean
  decryptedMessage: string | null
}

/**
 * Decoded result container component.
 * Displays the decoded message, transaction metadata, signature verification,
 * encrypted payload input, and decrypted result.
 */
export function DecodedResult({
  showResult,
  decodedMessage,
  txMeta,
  recoveredAddress,
  identifiedTemplate,
  extractedData,
  parsedTransaction,
  chainId,
  onFetchTransaction,
  isFetchingTransaction,
  passphrase,
  onPassphraseChange,
  onDecrypt,
  isDecrypting,
  decryptedMessage,
}: DecodedResultProps) {
  const cardStyleContainer = useCardStyle(false)
  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')

  const greenBorderVerified = useAccentBorderColor('green', 'borderVerified')
  const decodedBoxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderAccent, 'light'),
    `0 0 0 1px ${greenBorderVerified}`
  )
  const messageBoxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const greenVerified = useGreenVerifiedColors()
  const greenGradient = useAccentGradient('green')
  const dividerColor = useThemeBgColor('borderOverlaySubtle')

  return (
    <Collapse in={showResult && decodedMessage !== null} animateOpacity style={{overflow: 'visible'}}>
      {showResult && decodedMessage !== null && (
        <Box
          {...({...cardStyleContainer, bg: 'transparent', boxShadow: 'none'})}
          // boxShadow={decodedBoxShadow}
          position="relative"
          // overflow="hidden"
          animation={`${textReveal} 0.1s ease-out`}
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgGradient: `linear(to-r, transparent, ${greenGradient}, transparent)`,
          }}
        >
          <VStack align="stretch" spacing={4}>
            <Box
              bg={cardStyleContainer.bg}
              borderRadius={borderRadius.none}
              border="none"
              boxShadow={messageBoxShadow}
              overflow="hidden"
            >
              <HStack spacing={4} px={4} py={2} bg={cardStyleContainer.bg}>
                <Box
                  w="32px"
                  h="32px"
                  borderRadius={borderRadius.none}
                  bg={greenVerified.bg}
                  border="1px solid"
                  borderColor={greenVerified.borderColor}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Text fontSize="sm">📬</Text>
                </Box>
                <Text
                  fontSize="xs"
                  fontWeight="800"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color={greenVerified.textLight}
                >
                  Message Decoded
                </Text>
              </HStack>

              <Divider borderColor={dividerColor} />

              <Box
                bg={inputBg}
                px={0}
                py={2}
                borderRadius={borderRadius.none}
                border="none"
              >
                <Text
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                  color={inputText}
                  lineHeight="1.7"
                  fontFamily="mono"
                  px={4}
                >
                  {decodedMessage}
                </Text>
              </Box>
            </Box>

            {txMeta && <TransactionMetadata txMeta={txMeta} />}

            {(extractedData || identifiedTemplate || recoveredAddress) && (
              <ExtractedData
                extractedData={extractedData ?? null}
                parsedTransaction={parsedTransaction}
                chainId={chainId}
                onFetchTransaction={onFetchTransaction}
                isFetchingTransaction={isFetchingTransaction}
                template={identifiedTemplate}
                recoveredAddress={recoveredAddress || undefined}
                decodedMessage={decodedMessage || undefined}
              />
            )}

            {isEncrypted(decodedMessage) && (
              <EncryptedPayload
                passphrase={passphrase}
                onPassphraseChange={onPassphraseChange}
                onDecrypt={onDecrypt}
                isDecrypting={isDecrypting}
              />
            )}

            <DecryptedResult decryptedMessage={decryptedMessage} />
          </VStack>
        </Box>
      )}
    </Collapse>
  )
}
