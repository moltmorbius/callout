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
  Badge,
  Spinner,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { searchTransactionAcrossChains, fetchAndRecoverPublicKey } from '../utils/publicKeyRecovery'

export type EncryptionMode = 'disabled' | 'pubkey' | 'passphrase'

interface EncryptionControlsProps {
  mode: EncryptionMode
  onModeChange: (mode: EncryptionMode) => void
  publicKey: string
  onPublicKeyChange: (pubkey: string) => void
  passphrase: string
  onPassphraseChange: (pass: string) => void
}

export function EncryptionControls({
  mode,
  onModeChange,
  publicKey,
  onPublicKeyChange,
  passphrase,
  onPassphraseChange,
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
      <FormControl display="flex" alignItems="center" mb={mode !== 'disabled' ? 4 : 0}>
        <HStack flex={1} spacing={2.5}>
          <Text fontSize="sm" opacity={0.7}>🔒</Text>
          <FormLabel
            htmlFor="encrypt-toggle" mb={0}
            fontSize="11px" fontWeight="800"
            letterSpacing="0.12em" textTransform="uppercase"
            color="whiteAlpha.400" cursor="pointer"
          >
            Encrypt Message
          </FormLabel>
        </HStack>
        <Tooltip
          label="Encrypt with recipient's public key or a shared passphrase"
          placement="top" bg="gray.800" color="gray.200"
          fontSize="xs" borderRadius="lg" px={3} py={2}
        >
          <Box>
            <Switch
              id="encrypt-toggle"
              colorScheme="red" size="md"
              isChecked={mode !== 'disabled'}
              onChange={(e) => onModeChange(e.target.checked ? 'pubkey' : 'disabled')}
            />
          </Box>
        </Tooltip>
      </FormControl>

      <Collapse in={mode !== 'disabled'} animateOpacity>
        <VStack spacing={3} align="stretch">
          {/* Mode selector */}
          <HStack spacing={2}>
            <Badge
              cursor="pointer"
              onClick={() => onModeChange('pubkey')}
              variant={mode === 'pubkey' ? 'solid' : 'outline'}
              colorScheme={mode === 'pubkey' ? 'green' : 'gray'}
              fontSize="10px" fontWeight="700" px={2} py={1} borderRadius="md"
            >
              🔐 Public Key
            </Badge>
            <Badge
              cursor="pointer"
              onClick={() => onModeChange('passphrase')}
              variant={mode === 'passphrase' ? 'solid' : 'outline'}
              colorScheme={mode === 'passphrase' ? 'yellow' : 'gray'}
              fontSize="10px" fontWeight="700" px={2} py={1} borderRadius="md"
            >
              🔑 Passphrase
            </Badge>
          </HStack>

          {/* Public key mode */}
          {mode === 'pubkey' && (
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
                  Paste a transaction hash sent FROM the target address. We'll automatically recover their public key and encrypt the message so only they can decrypt it with their wallet.
                </Text>
              )}
            </VStack>
          )}

          {/* Passphrase mode */}
          {mode === 'passphrase' && (
            <Box>
              <Text fontSize="11px" color="whiteAlpha.400" mb={1.5} fontWeight="700"
                letterSpacing="0.06em" textTransform="uppercase">
                Encryption Passphrase
              </Text>
              <Input
                placeholder="Enter shared passphrase..."
                value={passphrase}
                onChange={(e) => onPassphraseChange(e.target.value)}
                type="password" fontSize="sm"
                bg="rgba(6, 6, 15, 0.9)"
                borderColor="whiteAlpha.100"
                borderRadius="xl" h="46px"
                _placeholder={{ color: 'whiteAlpha.200' }}
              />
              <Text fontSize="xs" color="whiteAlpha.300" mt={2} lineHeight="1.6">
                ⚠ You must share this passphrase with the recipient separately (off-chain).
              </Text>
            </Box>
          )}
        </VStack>
      </Collapse>
    </Box>
  )
}
