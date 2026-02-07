import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  Collapse,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import {
  recoverPublicKeyFromAddress,
  searchTransactionAcrossChains,
  fetchAndRecoverPublicKey,
  publicKeyToAddress,
} from '../utils/publicKeyRecovery'
import { borderRadius, boxShadows, getThemeValue } from '../config/themeTokens'
import { useThemeTextColor, useThemeBgColor, useAccentTextColor, useAccentBgColor } from '../shared/useThemeColors'
import { type Hex, type Address, isAddress } from 'viem'

interface EncryptionControlsProps {
  /** Whether encryption is enabled */
  enabled: boolean
  /** Callback when the encryption toggle changes */
  onEnabledChange: (enabled: boolean) => void
  /** The recovered or manually-entered public key */
  publicKey: string
  /** Callback when the public key changes */
  onPublicKeyChange: (pubkey: string) => void
  /** The target address (already entered in the form above) — used for auto-recovery */
  targetAddress?: string
  /** Contextual label for the target (e.g., "scammer", "victim", "developer").
   *  Falls back to "target" if not provided. */
  targetLabel?: string
  /** Currently selected chain ID — used to prioritize recovery search */
  chainId?: number
}

/**
 * Encryption controls section with:
 * - Toggle switch for enabling/disabling ECIES encryption
 * - "Use [target]'s address" button for automatic public key recovery
 * - Manual transaction hash input as fallback
 * - Public key display (auto-recovered or manually entered)
 *
 * Sits between the variable form progress bar and the MessageStatePreview.
 */
export function EncryptionControls({
  enabled,
  onEnabledChange,
  publicKey,
  onPublicKeyChange,
  targetAddress,
  targetLabel = 'target',
  chainId,
}: EncryptionControlsProps) {
  const [txHash, setTxHash] = useState('')
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [recoverySource, setRecoverySource] = useState<'auto' | 'txhash' | 'manual' | null>(null)
  const [recoveryChainName, setRecoveryChainName] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)

  // ── Theme colors ────────────────────────────────────────────────────
  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')
  const inputPlaceholder = useThemeTextColor('extraMuted')
  const textMuted = useThemeTextColor('muted')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const tooltipBg = useColorModeValue('gray.100', 'gray.800')
  const tooltipColor = useColorModeValue('gray.800', 'gray.200')
  const inputBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderInput, 'light'),
    getThemeValue(boxShadows.borderInput, 'dark')
  )
  const greenText = useAccentTextColor('green')
  const orangeText = useAccentTextColor('orange')
  const redBg = useAccentBgColor('red', 'bgBadge')
  const redText = useAccentTextColor('red')

  const isValidTargetAddress = targetAddress ? isAddress(targetAddress) : false

  /** Auto-recover public key from the target address by finding their transactions. */
  const handleAutoRecover = useCallback(async () => {
    if (!targetAddress || !isAddress(targetAddress)) return

    setIsRecovering(true)
    setRecoveryError(null)
    setRecoverySource(null)

    try {
      const result = await recoverPublicKeyFromAddress({
        address: targetAddress as Address,
        preferredChainId: chainId,
      })

      onPublicKeyChange(result.publicKey)
      setRecoverySource('auto')
      setRecoveryChainName(result.chainName)
      setRecoveryError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to recover public key'
      setRecoveryError(message)
      setShowManualInput(true)
    } finally {
      setIsRecovering(false)
    }
  }, [targetAddress, chainId, onPublicKeyChange])

  /** Recover public key from a manually-pasted transaction hash. */
  const handleTxHashChange = useCallback(async (value: string) => {
    setTxHash(value)
    setRecoveryError(null)

    if (!value || value.length !== 66 || !value.startsWith('0x')) {
      return
    }

    setIsRecovering(true)
    setRecoverySource(null)

    try {
      const found = await searchTransactionAcrossChains(value)
      if (!found) {
        setRecoveryError('Transaction not found on any supported network')
        setIsRecovering(false)
        return
      }

      const pubkey = await fetchAndRecoverPublicKey({
        rpcUrl: found.rpcUrl,
        txHash: value as Hex,
      })

      // Verify the derived address matches the target if we have one
      if (targetAddress && isAddress(targetAddress)) {
        const derivedAddress = publicKeyToAddress(pubkey)
        if (derivedAddress.toLowerCase() !== targetAddress.toLowerCase()) {
          setRecoveryError(
            `Address mismatch: this transaction was sent by ${derivedAddress.slice(0, 10)}..., ` +
            `not by the target address ${targetAddress.slice(0, 10)}...`
          )
          setIsRecovering(false)
          return
        }
      }

      onPublicKeyChange(pubkey)
      setRecoverySource('txhash')
      setRecoveryError(null)
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : 'Failed to recover public key')
    } finally {
      setIsRecovering(false)
    }
  }, [onPublicKeyChange, targetAddress])

  return (
    <Box>
      {/* ── Toggle ── */}
      <FormControl display="flex" alignItems="center" mb={enabled ? 4 : 0}>
        <HStack flex={1} spacing={2.5}>
          <Text fontSize="sm" opacity={0.7}>🔒</Text>
          <FormLabel
            htmlFor="encrypt-toggle"
            mb={0}
            fontSize="11px"
            fontWeight="800"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color={textVeryMuted}
            cursor="pointer"
          >
            Encrypt Message (ECIES)
          </FormLabel>
        </HStack>
        <Tooltip
          label="Encrypt with recipient's public key — only they can decrypt with their private key"
          placement="top"
          bg={tooltipBg}
          color={tooltipColor}
          fontSize="xs"
          borderRadius="lg"
          px={3}
          py={2}
        >
          <Box>
            <Switch
              id="encrypt-toggle"
              colorScheme="red"
              size="md"
              isChecked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
            />
          </Box>
        </Tooltip>
      </FormControl>

      {/* ── Encryption inputs (collapsed when disabled) ── */}
      <Collapse in={enabled} animateOpacity>
        <VStack spacing={3} align="stretch">
          {/* Primary action: Use target's address button */}
          {isValidTargetAddress && !publicKey && (
            <Button
              size="sm"
              variant="outline"
              border="1px solid"
              borderColor={redText}
              color={redText}
              borderRadius={borderRadius.none}
              onClick={handleAutoRecover}
              isLoading={isRecovering && recoverySource === null}
              loadingText={`Looking up ${targetLabel}'s transactions...`}
              _hover={{ bg: redBg }}
              fontWeight="700"
              fontSize="xs"
              letterSpacing="0.04em"
              textTransform="uppercase"
              h="40px"
            >
              Use {targetLabel}'s address
            </Button>
          )}

          {/* No target address entered */}
          {!isValidTargetAddress && !publicKey && !showManualInput && (
            <Text fontSize="xs" color={textMuted} lineHeight="1.6">
              Enter a target address above first, or{' '}
              <Text
                as="span"
                color={redText}
                cursor="pointer"
                textDecoration="underline"
                onClick={() => setShowManualInput(true)}
              >
                manually provide a transaction hash or public key
              </Text>.
            </Text>
          )}

          {/* Recovery progress */}
          {isRecovering && (
            <HStack spacing={2}>
              <Spinner size="xs" color={greenText} />
              <Text fontSize="xs" color={greenText}>
                Searching for transactions and recovering public key...
              </Text>
            </HStack>
          )}

          {/* Recovery error */}
          {recoveryError && (
            <Box>
              <Text fontSize="xs" color={orangeText} lineHeight="1.5">
                ⚠ {recoveryError}
              </Text>
              {!showManualInput && (
                <Text
                  fontSize="xs"
                  color={redText}
                  cursor="pointer"
                  textDecoration="underline"
                  mt={1}
                  onClick={() => setShowManualInput(true)}
                >
                  Try manual entry instead
                </Text>
              )}
            </Box>
          )}

          {/* Manual transaction hash input (shown on fallback or explicit toggle) */}
          {showManualInput && !publicKey && (
            <Box>
              <Text
                fontSize="11px"
                color={textVeryMuted}
                mb={1.5}
                fontWeight="700"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                Transaction Hash (sent FROM {targetLabel})
              </Text>
              <Input
                placeholder={`0x... tx hash sent FROM the ${targetLabel}'s address`}
                value={txHash}
                onChange={(e) => handleTxHashChange(e.target.value)}
                fontFamily="mono"
                fontSize="xs"
                bg={inputBg}
                color={inputText}
                border="none"
                boxShadow={recoveryError ? '0 0 0 1px var(--chakra-colors-orange-500)' : inputBorderShadow}
                borderRadius={borderRadius.none}
                h="46px"
                _placeholder={{ color: inputPlaceholder }}
              />
            </Box>
          )}

          {/* Public key display (recovered or manual) */}
          {(publicKey || showManualInput) && (
            <Box>
              <Text
                fontSize="11px"
                color={textVeryMuted}
                mb={1.5}
                fontWeight="700"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                Public Key{' '}
                {recoverySource === 'auto' && recoveryChainName && `(recovered via ${recoveryChainName})`}
                {recoverySource === 'txhash' && '(recovered from tx)'}
              </Text>
              <Input
                placeholder="0x04... uncompressed public key (65 bytes)"
                value={publicKey}
                onChange={(e) => {
                  onPublicKeyChange(e.target.value)
                  setRecoverySource('manual')
                }}
                fontFamily="mono"
                fontSize="xs"
                bg={inputBg}
                color={inputText}
                border="none"
                boxShadow={publicKey ? '0 0 0 1px var(--chakra-colors-green-500)' : inputBorderShadow}
                borderRadius={borderRadius.none}
                h="46px"
                _placeholder={{ color: inputPlaceholder }}
                isReadOnly={recoverySource !== 'manual' && recoverySource !== null && !!publicKey}
              />
              {publicKey && recoverySource && recoverySource !== 'manual' && (
                <HStack mt={2} spacing={2}>
                  <Box w="6px" h="6px" borderRadius="full" bg={greenText} />
                  <Text fontSize="xs" color={greenText}>
                    Public key recovered successfully
                  </Text>
                </HStack>
              )}
            </Box>
          )}

          {/* Explanation text when no key recovered yet */}
          {!publicKey && !showManualInput && isValidTargetAddress && !isRecovering && !recoveryError && (
            <Text fontSize="xs" color={textMuted} lineHeight="1.6">
              Click the button above to automatically look up the {targetLabel}'s transactions
              and recover their public key for ECIES encryption. Only they will be able to
              decrypt this message with their wallet's private key.
            </Text>
          )}
        </VStack>
      </Collapse>
    </Box>
  )
}
