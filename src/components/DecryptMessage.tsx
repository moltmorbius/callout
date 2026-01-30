import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  Code,
  useToast,
  Collapse,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { decodeMessage, isLikelyText } from '../utils/encoding'
import { decryptMessage, isEncryptedMessage } from '../utils/encryption'

const cardStyle = {
  bg: 'rgba(14, 14, 30, 0.6)',
  borderRadius: '2xl',
  border: '1px solid',
  borderColor: 'whiteAlpha.50',
  p: { base: 4, md: 6 },
}

export function DecryptMessage() {
  const { isConnected } = useAccount()
  const toast = useToast()

  const [calldataInput, setCalldataInput] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null)
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDecode = useCallback(() => {
    setError(null)
    setDecodedMessage(null)
    setDecryptedMessage(null)

    let hex = calldataInput.trim()
    if (!hex.startsWith('0x')) {
      hex = '0x' + hex
    }

    try {
      const decoded = decodeMessage(hex as `0x${string}`)
      if (!isLikelyText(hex as `0x${string}`)) {
        setError('The decoded data does not appear to be a text message.')
        setDecodedMessage(decoded)
        return
      }
      setDecodedMessage(decoded)

      if (isEncryptedMessage(decoded)) {
        toast({
          title: 'Encrypted message detected',
          description: 'Enter the passphrase to decrypt.',
          status: 'info',
          duration: 3000,
        })
      }
    } catch {
      setError('Failed to decode. Make sure the input is valid hex calldata.')
    }
  }, [calldataInput, toast])

  const handleDecrypt = useCallback(async () => {
    if (!decodedMessage || !passphrase) return
    setIsDecrypting(true)
    setError(null)

    try {
      const plain = await decryptMessage(decodedMessage, passphrase)
      setDecryptedMessage(plain)
      toast({
        title: 'Decrypted!',
        status: 'success',
        duration: 3000,
      })
    } catch {
      setError('Decryption failed. Wrong passphrase or corrupted data.')
    } finally {
      setIsDecrypting(false)
    }
  }, [decodedMessage, passphrase, toast])

  if (!isConnected) {
    return (
      <Box
        textAlign="center"
        py={{ base: 12, md: 20 }}
        px={6}
        {...cardStyle}
      >
        <Box
          w="64px"
          h="64px"
          borderRadius="2xl"
          bg="rgba(99, 179, 237, 0.08)"
          border="1px solid"
          borderColor="rgba(99, 179, 237, 0.15)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          mb={5}
        >
          <Text fontSize="2xl">🔓</Text>
        </Box>
        <Text fontSize="lg" fontWeight="700" color="whiteAlpha.700" mb={2}>
          Wallet Required
        </Text>
        <Text fontSize="sm" color="whiteAlpha.400" mb={6} maxW="300px" mx="auto">
          Connect your wallet to decode on-chain messages
        </Text>
        <Box display="inline-block">
          <appkit-button />
        </Box>
      </Box>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Input Section */}
      <Box
        {...cardStyle}
        borderColor="rgba(99, 179, 237, 0.12)"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgGradient: 'linear(to-r, transparent, rgba(99,179,237,0.3), transparent)',
        }}
      >
        <HStack spacing={2} mb={4}>
          <Text fontSize="md">🔍</Text>
          <Text
            fontSize="xs"
            fontWeight="800"
            letterSpacing="0.1em"
            textTransform="uppercase"
            color="blue.300"
          >
            Transaction Calldata
          </Text>
        </HStack>
        <Text fontSize="xs" color="whiteAlpha.300" mb={3}>
          Paste the hex input data from a transaction to decode the hidden message.
        </Text>
        <Textarea
          placeholder="0x48656c6c6f..."
          value={calldataInput}
          onChange={(e) => setCalldataInput(e.target.value)}
          fontFamily="mono"
          fontSize="sm"
          bg="rgba(6, 6, 15, 0.8)"
          borderColor="whiteAlpha.100"
          rows={4}
          mb={3}
          _focus={{
            borderColor: 'blue.400',
            boxShadow: '0 0 0 1px rgba(99, 179, 237, 0.3), 0 0 20px rgba(99, 179, 237, 0.08)',
          }}
        />
        <Button
          size="lg"
          width="full"
          h="48px"
          fontSize="sm"
          fontWeight="800"
          letterSpacing="0.05em"
          textTransform="uppercase"
          onClick={handleDecode}
          isDisabled={!calldataInput.trim()}
          bg="rgba(99, 179, 237, 0.15)"
          color="blue.300"
          border="1px solid"
          borderColor="rgba(99, 179, 237, 0.25)"
          borderRadius="xl"
          _hover={{
            bg: 'rgba(99, 179, 237, 0.25)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 20px rgba(99, 179, 237, 0.15)',
          }}
          _active={{
            transform: 'translateY(0)',
          }}
          _disabled={{
            bg: 'whiteAlpha.50',
            color: 'whiteAlpha.300',
            borderColor: 'whiteAlpha.50',
            cursor: 'not-allowed',
            _hover: {
              bg: 'whiteAlpha.50',
              transform: 'none',
              boxShadow: 'none',
            },
          }}
          transition="all 0.2s"
        >
          🔓 Decode Message
        </Button>
      </Box>

      {/* Error */}
      <Collapse in={!!error} animateOpacity>
        {error && (
          <Box
            p={4}
            borderRadius="xl"
            bg="rgba(236, 201, 75, 0.06)"
            border="1px solid"
            borderColor="rgba(236, 201, 75, 0.2)"
          >
            <HStack>
              <Text fontSize="sm" color="yellow.300">⚠</Text>
              <Text fontSize="sm" color="yellow.200">
                {error}
              </Text>
            </HStack>
          </Box>
        )}
      </Collapse>

      {/* Decoded Result */}
      <Collapse in={decodedMessage !== null} animateOpacity>
        {decodedMessage !== null && (
          <Box
            {...cardStyle}
            borderColor="rgba(72, 187, 120, 0.15)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              bgGradient: 'linear(to-r, transparent, rgba(72,187,120,0.3), transparent)',
            }}
          >
            <HStack spacing={2} mb={4}>
              <Text fontSize="md">📬</Text>
              <Text
                fontSize="xs"
                fontWeight="800"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="green.300"
              >
                Decoded Message
              </Text>
            </HStack>
            <Box
              bg="rgba(6, 6, 15, 0.9)"
              p={4}
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.50"
            >
              <Text fontSize="sm" whiteSpace="pre-wrap" color="whiteAlpha.700" lineHeight="1.7" fontFamily="mono">
                {decodedMessage}
              </Text>
            </Box>

            {/* Decrypt section for encrypted messages */}
            {isEncryptedMessage(decodedMessage) && (
              <Box mt={4}>
                <HStack spacing={2} mb={3}>
                  <Text fontSize="sm" color="yellow.300">🔒</Text>
                  <Text fontSize="xs" color="yellow.300" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase">
                    Encrypted — Enter Passphrase
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Input
                    placeholder="Passphrase..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    type="password"
                    fontSize="sm"
                    bg="rgba(6, 6, 15, 0.8)"
                    borderColor="whiteAlpha.100"
                    h="44px"
                    _focus={{
                      borderColor: 'yellow.400',
                      boxShadow: '0 0 0 1px rgba(236, 201, 75, 0.3)',
                    }}
                  />
                  <Button
                    h="44px"
                    px={6}
                    fontSize="sm"
                    fontWeight="700"
                    bg="rgba(236, 201, 75, 0.15)"
                    color="yellow.300"
                    border="1px solid"
                    borderColor="rgba(236, 201, 75, 0.25)"
                    borderRadius="lg"
                    onClick={handleDecrypt}
                    isLoading={isDecrypting}
                    isDisabled={!passphrase}
                    _hover={{
                      bg: 'rgba(236, 201, 75, 0.25)',
                    }}
                    _disabled={{
                      opacity: 0.4,
                      cursor: 'not-allowed',
                      _hover: { bg: 'rgba(236, 201, 75, 0.15)' },
                    }}
                  >
                    Decrypt
                  </Button>
                </HStack>
              </Box>
            )}

            {/* Decrypted result */}
            <Collapse in={!!decryptedMessage} animateOpacity>
              {decryptedMessage && (
                <Box
                  mt={4}
                  p={4}
                  bg="rgba(72, 187, 120, 0.08)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="rgba(72, 187, 120, 0.25)"
                >
                  <HStack mb={2}>
                    <Text fontSize="sm" color="green.300" fontWeight="700">🔓 Decrypted</Text>
                  </HStack>
                  <Code
                    bg="transparent"
                    color="green.300"
                    whiteSpace="pre-wrap"
                    display="block"
                    fontSize="sm"
                    fontFamily="mono"
                  >
                    {decryptedMessage}
                  </Code>
                </Box>
              )}
            </Collapse>
          </Box>
        )}
      </Collapse>
    </VStack>
  )
}
