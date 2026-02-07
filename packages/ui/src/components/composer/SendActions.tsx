import { Box, VStack, HStack, Text, Button, Code, Link, Collapse } from '@chakra-ui/react'
import { useBalance, useEstimateGas } from 'wagmi'
import { type Address, type Hex, parseEther, formatUnits } from 'viem'
import { useAppKit } from '@reown/appkit/react'
import { useCardStyle } from '../../shared/styles'
import { SectionLabel } from '../../shared/SectionLabel'
import { borderRadius, boxShadows, getThemeValue } from '../../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { useThemeTextColor, useThemeBgColor, useAccentBgColor, useAccentBorderColor, useAccentTextColor, useAccentShadow, usePurpleMetaColors, useGreenMetaColors } from '../../shared/useThemeColors'
import { getExplorerTxUrl } from '../../config/web3'
import { useAccount, useChainId } from 'wagmi'
import { ChainIcon } from '../../shared/ChainIcon'

interface SendActionsProps {
  message: string
  calldata: Hex | undefined
  targetAddress: Address | string
  isValidTarget: boolean
  signMode: boolean
  isSending: boolean
  lastSignature: string | null
  lastTxHash: string | null
  onSignModeToggle: () => void
  onSend: () => void
  onSign: () => void
}

/**
 * Send/sign actions component with preview, balance, gas estimate, and results.
 */
export function SendActions({
  message,
  calldata,
  targetAddress,
  isValidTarget,
  signMode,
  isSending,
  lastSignature,
  lastTxHash,
  onSignModeToggle,
  onSend,
  onSign,
}: SendActionsProps) {
  const { address: walletAddress, isConnected } = useAccount()
  const { open } = useAppKit()
  const cardStyleContainer = useCardStyle(true)
  const { data: balance } = useBalance({ address: walletAddress })
  const { data: gasEstimate } = useEstimateGas(
    isValidTarget && calldata
      ? {
          to: targetAddress as Address,
          data: calldata,
          value: parseEther('0'),
        }
      : undefined,
  )

  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')
  const textMuted = useThemeTextColor('muted')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const cardBg = useThemeBgColor('card')
  const cardBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const accentBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderAccent, 'light'),
    getThemeValue(boxShadows.borderAccent, 'dark')
  )
  const purpleMeta = usePurpleMetaColors()
  const greenMeta = useGreenMetaColors()
  const purpleBgButton = useAccentBgColor('purple', 'bgBadge')
  const purpleBgButtonHover = useAccentBgColor('purple', 'bgBadge')
  const purpleText = useAccentTextColor('purpleLight')
  const greenText = useAccentTextColor('greenLight')
  const greenTextMain = useAccentTextColor('green')
  const redText = useAccentTextColor('red')
  const purpleTextMain = useAccentTextColor('purple')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const interactiveHoverBg = useThemeBgColor('interactiveHover')
  const chainId = useChainId()

  // Button colors
  const redGradient = useAccentBgColor('red', 'bgGradient')
  const redBgButton = useAccentBgColor('red', 'bgButton')
  const redBgGradientStrong = useAccentBgColor('red', 'bgGradientStrong')
  const redBorder = useAccentBorderColor('red', 'border')
  const redBorderStrong = useAccentBorderColor('red', 'borderStrong')
  const redShadowStrong = useAccentShadow('red', 'shadowStrong')
  const redShadowGlow = useAccentShadow('red', 'shadowGlow')
  const purpleBgButtonDisabled = useAccentBgColor('purple', 'bgButtonDisabled')
  const purpleBgButtonHoverActive = useAccentBgColor('purple', 'bgButtonHover')
  const purpleBorderFocus = useAccentBorderColor('purple', 'borderFocus')
  const purpleShadow = useAccentShadow('purple', 'shadow')
  const purpleShadowGlow = useAccentShadow('purple', 'shadowGlow')
  const purpleShadowStrong = useAccentShadow('purple', 'shadowStrong')

  return (
    <Box
      {...cardStyleContainer}
      boxShadow={accentBorderShadow}
      position="relative" overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '2px',
        bgGradient: `linear(to-r, transparent, ${redGradient}, transparent)`,
      }}
    >
      {isConnected && (
        <>
          <SectionLabel icon="📤" label="Ready to Send" accent={redText} />

          {/* Message text */}
          <Box
            bg={inputBg}
            p={4} borderRadius={borderRadius.none}
            border="none"
            boxShadow={cardBorderShadow}
            mb={4}
          >
            <Text fontSize="sm" whiteSpace="pre-wrap" color={inputText} lineHeight="1.7">
              {message}
            </Text>
          </Box>
        </>
      )}

      {/* Balance & Gas info */}
      {(balance || (!signMode && gasEstimate)) && (
        <VStack align="stretch" mb={4} spacing={2}>
          {/* Native token balance */}
          {balance && (
            <HStack
              p={3}
              bg={cardBg} borderRadius={borderRadius.none}
              border="none"
              boxShadow={cardBorderShadow}
              spacing={2}
              justify="space-between"
            >
              <HStack spacing={2}>
                <Text fontSize="xs" color={textMuted}>💰</Text>
                <Text fontSize="xs" color={textMuted}>Your balance:</Text>
              </HStack>
              <HStack spacing={1} align="center">
                <Text fontSize="xs" color={inputText} fontFamily="mono" fontWeight="600">
                  {formatUnits(balance.value, balance.decimals)}
                </Text>
                <ChainIcon chainId={chainId} w="16px" h="16px" />
                <Text fontSize="xs" color={inputText} fontFamily="mono" fontWeight="600">
                  {balance.symbol}
                </Text>
              </HStack>
            </HStack>
          )}

          {/* Gas estimate (only when sending) */}
          {!signMode && gasEstimate && (
            <HStack
              p={3}
              bg={cardBg} borderRadius={borderRadius.none}
              border="none"
              boxShadow={cardBorderShadow}
              spacing={2}
              justify="space-between"
            >
              <HStack spacing={2}>
                <Text fontSize="xs" color={textMuted}>⛽</Text>
                <Text fontSize="xs" color={textMuted}>Estimated gas:</Text>
              </HStack>
              <Text fontSize="xs" color={inputText} fontFamily="mono" fontWeight="600">
                {gasEstimate.toString()}
              </Text>
            </HStack>
          )}
        </VStack>
      )}

      {/* Sign mode toggle - only show when connected */}
      {isConnected && (
        <Box
          mb={4} p={4}
          bg={cardBg} borderRadius={borderRadius.none}
          border="none"
          boxShadow={cardBorderShadow}
        >
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1} flex={1}>
              <HStack spacing={2}>
                <Text fontSize="sm" fontWeight="700" color={inputText}>
                  🔏 Sign Message (No Transaction)
                </Text>
              </HStack>
              <Text fontSize="xs" color={textVeryMuted} lineHeight="1.5">
                Prove ownership without sending. Useful if the address is compromised.
              </Text>
            </VStack>
            <Button
              size="sm"
              onClick={onSignModeToggle}
              bg={signMode ? purpleBgButton : cardBg}
              border="none"
              boxShadow={signMode ? purpleMeta.borderShadow : cardBorderShadow}
              color={signMode ? purpleText : textExtraMuted}
              borderRadius={borderRadius.none}
              _hover={{
                bg: signMode ? purpleBgButtonHover : interactiveHoverBg,
              }}
            >
              {signMode ? 'Enabled' : 'Disabled'}
            </Button>
          </HStack>
        </Box>
      )}

      {/* Send or Sign button */}
      {isConnected && (
        <>
          <Button
            size="lg" width="full" h="60px"
            fontSize="md" fontWeight="900"
            letterSpacing="0.1em" textTransform="uppercase"
            isLoading={isSending}
            loadingText={signMode ? 'Signing...' : 'Broadcasting...'}
            isDisabled={signMode ? !message.trim() : (!isValidTarget || !calldata)}
            onClick={signMode ? onSign : onSend}
            aria-label={signMode ? 'Sign message to prove ownership' : 'Send message on-chain permanently'}
            bg={
              (signMode ? !message.trim() : (!isValidTarget || !calldata))
                ? (signMode ? purpleBgButtonDisabled : redBgButton)
                : (signMode ? purpleBgButtonHoverActive : redBgGradientStrong)
            }
            color={
              (signMode ? !message.trim() : (!isValidTarget || !calldata))
                ? (signMode ? purpleBorderFocus : redBorder)
                : 'white'
            }
            border="2px solid"
            borderColor={
              (signMode ? !message.trim() : (!isValidTarget || !calldata))
                ? (signMode ? purpleBgButtonDisabled : redBgButton)
                : (signMode ? purpleBorderFocus : redBorderStrong)
            }
            borderRadius={0}
            _hover={{
              bg: signMode ? 'purple.600' : 'red.600',
              transform: 'translateY(-2px)',
              boxShadow: signMode
                ? `0 8px 50px ${purpleShadow}, 0 0 80px ${purpleShadowGlow}`
                : `0 8px 50px ${redShadowStrong}, 0 0 80px ${redShadowGlow}`,
            }}
            _active={{ transform: 'translateY(0)', bg: signMode ? 'purple.700' : 'red.700' }}
            _disabled={{
              cursor: 'not-allowed', opacity: 1,
              _hover: {
                transform: 'none',
                boxShadow: 'none',
                bg: signMode ? purpleBgButtonDisabled : redBgButton,
              },
            }}
            transition="all 0.1s"
            boxShadow={
              (signMode ? !message.trim() : (!isValidTarget || !calldata))
                ? 'none'
                : (signMode
                  ? `0 4px 30px ${purpleShadowStrong}`
                  : `0 4px 30px ${redShadowStrong}`)
            }
          >
            {signMode
              ? '🔏 Sign Message'
              : '⚠️ Send On-Chain — Permanent'}
          </Button>

          <Text fontSize="10px" color={textExtraMuted} textAlign="center" mt={3} lineHeight="1.5">
            {signMode
              ? 'Signature proves you control this address without sending a transaction.'
              : 'This is irreversible. Your message will be inscribed on the blockchain forever.'}
          </Text>
        </>
      )}

      {/* Signature result */}
      <Collapse in={!!lastSignature} animateOpacity>
        {lastSignature && (
          <Box
            mt={5} p={5}
            bg={purpleMeta.bg} borderRadius={borderRadius.none}
            border="none" boxShadow={purpleMeta.borderShadow}
          >
            <HStack mb={3}>
              <Box
                w="24px" h="24px" borderRadius="full"
                bg={purpleMeta.bg}
                display="flex" alignItems="center" justifyContent="center"
              >
                <Text fontSize="xs" color={purpleText}>✓</Text>
              </Box>
              <Text fontSize="sm" fontWeight="700" color={purpleText}>
                Message Signed Successfully
              </Text>
            </HStack>

            <VStack align="stretch" spacing={3}>
              {/* Message */}
              <Box>
                <Text fontSize="xs" color={textVeryMuted} mb={1} fontWeight="600">
                  Message:
                </Text>
                <Code
                  fontSize="xs" bg={inputBg}
                  color={purpleText} fontFamily="mono"
                  display="block" p={3} borderRadius={borderRadius.none}
                  border="none"
                  boxShadow={cardBorderShadow}
                  whiteSpace="pre-wrap" wordBreak="break-all"
                >
                  {message}
                </Code>
              </Box>

              {/* Signature */}
              <Box>
                <Text fontSize="xs" color={textVeryMuted} mb={1} fontWeight="600">
                  Signature:
                </Text>
                <Code
                  fontSize="xs" bg={inputBg}
                  color={purpleTextMain} fontFamily="mono"
                  display="block" p={3} borderRadius={borderRadius.none}
                  border="none"
                  boxShadow={cardBorderShadow}
                  whiteSpace="pre-wrap" wordBreak="break-all"
                >
                  {lastSignature}
                </Code>
              </Box>

              <Text fontSize="xs" color={textMuted} lineHeight="1.6" pt={2}>
                💡 Copy this message + signature to prove you control {walletAddress}. Anyone can verify it using tools like Etherscan's signature verifier.
              </Text>
            </VStack>
          </Box>
        )}
      </Collapse>

      {/* Transaction result */}
      <Collapse in={!!lastTxHash} animateOpacity>
        {lastTxHash && (
          <Box
            mt={5} p={5}
            bg={greenMeta.bg} borderRadius={borderRadius.none}
            border="none" boxShadow={greenMeta.borderShadow}
          >
            <HStack mb={3}>
              <Box
                w="24px" h="24px" borderRadius="full"
                bg={greenMeta.bg}
                display="flex" alignItems="center" justifyContent="center"
              >
                <Text fontSize="xs" color={greenTextMain}>✓</Text>
              </Box>
              <Text fontSize="sm" fontWeight="700" color={greenText}>
                Message Broadcast Successfully
              </Text>
            </HStack>
            <Code
              fontSize="xs" bg={inputBg}
              color={greenTextMain} fontFamily="mono"
              display="block" p={3} borderRadius={borderRadius.none}
              mb={3} wordBreak="break-all" whiteSpace="normal"
              border="none"
              boxShadow={cardBorderShadow}
            >
              {lastTxHash}
            </Code>
            <Link
              href={getExplorerTxUrl(chainId, lastTxHash)}
              isExternal color={greenText} fontSize="xs"
              fontWeight="700" letterSpacing="0.03em"
              _hover={{ color: greenTextMain, textDecoration: 'underline' }}
            >
              View on Block Explorer →
            </Link>
          </Box>
        )}
      </Collapse>
    </Box>
  )
}
