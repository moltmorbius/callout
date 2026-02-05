import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  Collapse,
  Spinner,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { searchTransactionAcrossChains, fetchAndRecoverPublicKey } from '../utils/publicKeyRecovery'

interface EncryptionControlsProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  publicKey: string
  onPublicKeyChange: (pubkey: string) => void
}

export function EncryptionControls({
  enabled,
  onEnabledChange,
  publicKey,
  onPublicKeyChange,
}: EncryptionControlsProps) {
  const [txHash, setTxHash] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [useManualPubkey, setUseManualPubkey] = useState(false)

  // Auto-search for public key when tx hash is pasted
  const handleTxHashChange = useCallback(async (value: string) => {
    setTxHash(value)
    setSearchError(null)
    
    if (!value || value.length !== 66 || !value.startsWith('0x')) {
      return
    }

    setIsSearching(true)
    
    try {
      // Search across chains
      const found = await searchTransactionAcrossChains(value)
      if (!found) {
        setSearchError('Transaction not found on any network')
        setUseManualPubkey(true)
        setIsSearching(false)
        return
      }

      // Recover public key
      const pubkey = await fetchAndRecoverPublicKey(found.rpcUrl, value as `0x${string}`)
      onPublicKeyChange(pubkey)
      setSearchError(null)
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to recover public key')
      setUseManualPubkey(true)
    } finally {
      setIsSearching(false)
    }
  }, [onPublicKeyChange])

  return (
    <Box>
      <FormControl display="flex" alignItems="center" mb={enabled ? 4 : 0}>
        <HStack flex={1} spacing={2.5}>
          <Text fontSize="sm" opacity={0.7}>🔒</Text>
          <FormLabel
            htmlFor="encrypt-toggle" mb={0}
            fontSize="11px" fontWeight="800"
            letterSpacing="0.12em" textTransform="uppercase"
            color="whiteAlpha.400" cursor="pointer"
          >
            Encrypt Message (ECIES)
          </FormLabel>
        </HStack>
        <Tooltip
          label="Encrypt with recipient's public key — only they can decrypt with their private key"
          placement="top" bg="gray.800" color="gray.200"
          fontSize="xs" borderRadius="lg" px={3} py={2}
        >
          <Box>
            <Switch
              id="encrypt-toggle"
              colorScheme="red" size="md"
              isChecked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
            />
          </Box>
        </Tooltip>
      </FormControl>

      <Collapse in={enabled} animateOpacity>
        <VStack spacing={3} align="stretch">
          {/* Public key mode */}
          {(
            <VStack spacing={3} align="stretch">
              <Box>
                <Text fontSize="11px" color="whiteAlpha.400" mb={1.5} fontWeight="700"
                  letterSpacing="0.06em" textTransform="uppercase">
                  Transaction Hash (from target address)
                </Text>
                <Input
                  placeholder="0x... tx hash sent FROM the target address"
                  value={txHash}
                  onChange={(e) => handleTxHashChange(e.target.value)}
                  fontFamily="mono" fontSize="xs"
                  bg="rgba(6, 6, 15, 0.9)"
                  borderColor={searchError ? 'orange.500' : 'whiteAlpha.100'}
                  borderRadius="xl" h="46px"
                  _placeholder={{ color: 'whiteAlpha.200' }}
                />
                {isSearching && (
                  <HStack mt={2} spacing={2}>
                    <Spinner size="xs" color="green.400" />
                    <Text fontSize="xs" color="green.400">Searching for transaction...</Text>
                  </HStack>
                )}
                {searchError && (
                  <Text fontSize="xs" color="orange.400" mt={2}>⚠ {searchError}</Text>
                )}
              </Box>

              {(useManualPubkey || publicKey) && (
                <Box>
                  <Text fontSize="11px" color="whiteAlpha.400" mb={1.5} fontWeight="700"
                    letterSpacing="0.06em" textTransform="uppercase">
                    Public Key {!useManualPubkey && '(auto-recovered)'}
                  </Text>
                  <Input
                    placeholder="0x04... uncompressed public key (65 bytes)"
                    value={publicKey}
                    onChange={(e) => onPublicKeyChange(e.target.value)}
                    fontFamily="mono" fontSize="xs"
                    bg="rgba(6, 6, 15, 0.9)"
                    borderColor={publicKey ? 'green.500' : 'whiteAlpha.100'}
                    borderRadius="xl" h="46px"
                    _placeholder={{ color: 'whiteAlpha.200' }}
                    isReadOnly={!useManualPubkey}
                  />
                  {publicKey && !useManualPubkey && (
                    <HStack mt={2} spacing={2}>
                      <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
                      <Text fontSize="xs" color="green.400">Public key recovered successfully</Text>
                    </HStack>
                  )}
                </Box>
              )}

              {!useManualPubkey && !publicKey && (
                <Text fontSize="xs" color="whiteAlpha.300" lineHeight="1.6">
                  Paste a transaction hash sent FROM the target address. We'll automatically recover their public key and encrypt the message using ECIES (secp256k1). Only they can decrypt it with their wallet's private key.
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      </Collapse>
    </Box>
  )
}
