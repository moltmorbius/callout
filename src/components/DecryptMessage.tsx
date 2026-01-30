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
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { decodeMessage, isLikelyText } from '../utils/encoding'
import { decryptMessage, isEncryptedMessage } from '../utils/encryption'

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
      setError('Failed to decode calldata. Make sure it is valid hex.')
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
        py={16}
        px={6}
        bg="whiteAlpha.50"
        borderRadius="xl"
        border="1px dashed"
        borderColor="whiteAlpha.200"
      >
        <Text fontSize="4xl" mb={4}>
          🔓
        </Text>
        <Text fontSize="lg" color="gray.400">
          Connect your wallet to decode on-chain messages
        </Text>
        <Box mt={4}>
          <appkit-button />
        </Box>
      </Box>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Calldata Input */}
      <Box bg="whiteAlpha.50" borderRadius="xl" p={5} border="1px solid" borderColor="whiteAlpha.100">
        <HStack mb={3}>
          <Text fontSize="lg">🔍</Text>
          <Text fontWeight="bold" color="gray.300">
            Transaction Calldata
          </Text>
        </HStack>
        <Text fontSize="xs" color="gray.500" mb={3}>
          Paste the hex calldata (input data) from a transaction to decode the message.
        </Text>
        <Textarea
          placeholder="0x48656c6c6f..."
          value={calldataInput}
          onChange={(e) => setCalldataInput(e.target.value)}
          fontFamily="mono"
          fontSize="sm"
          bg="blackAlpha.400"
          borderColor="whiteAlpha.200"
          rows={4}
          mb={3}
        />
        <Button
          colorScheme="blue"
          onClick={handleDecode}
          isDisabled={!calldataInput.trim()}
          width="full"
          leftIcon={<Text>📖</Text>}
        >
          Decode Message
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert status="warning" borderRadius="lg" bg="orange.900" border="1px solid" borderColor="orange.600">
          <AlertIcon color="orange.300" />
          <Text fontSize="sm" color="orange.200">
            {error}
          </Text>
        </Alert>
      )}

      {/* Decoded Result */}
      {decodedMessage !== null && (
        <Box bg="whiteAlpha.50" borderRadius="xl" p={5} border="1px solid" borderColor="whiteAlpha.100">
          <Text fontWeight="bold" color="gray.300" mb={3}>
            📬 Decoded Message
          </Text>
          <Box bg="blackAlpha.500" p={4} borderRadius="md">
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {decodedMessage}
            </Text>
          </Box>

          {/* Decrypt section */}
          {isEncryptedMessage(decodedMessage) && (
            <Box mt={4}>
              <Text fontSize="sm" color="yellow.300" mb={2}>
                🔒 This message is encrypted. Enter the passphrase to decrypt:
              </Text>
              <HStack>
                <Input
                  placeholder="Passphrase..."
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  type="password"
                  bg="blackAlpha.400"
                  borderColor="whiteAlpha.200"
                />
                <Button
                  colorScheme="yellow"
                  onClick={handleDecrypt}
                  isLoading={isDecrypting}
                  isDisabled={!passphrase}
                >
                  Decrypt
                </Button>
              </HStack>
            </Box>
          )}

          {decryptedMessage && (
            <Box mt={4} p={4} bg="green.900" borderRadius="md" border="1px solid" borderColor="green.600">
              <Text fontSize="sm" color="green.200" mb={1}>
                🔓 Decrypted Message:
              </Text>
              <Code bg="transparent" color="green.300" whiteSpace="pre-wrap" display="block">
                {decryptedMessage}
              </Code>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  )
}
