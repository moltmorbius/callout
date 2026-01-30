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
  Flex,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { decodeMessage, isLikelyText } from '../utils/encoding'
import { decryptMessage, isEncryptedMessage } from '../utils/encryption'

const card = {
  bg: 'rgba(255,255,255,0.02)',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.06)',
  p: 6,
  transition: 'all 0.2s',
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
        setError('Decoded data does not appear to contain readable text.')
        setDecodedMessage(decoded)
        return
      }
      setDecodedMessage(decoded)

      if (isEncryptedMessage(decoded)) {
        toast({
          title: 'Encrypted payload detected',
          description: 'Enter the passphrase to decrypt.',
          status: 'info',
          duration: 3000,
        })
      }
    } catch {
      setError('Invalid hex data. Check the input and try again.')
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
        title: 'Decrypted.',
        status: 'success',
        duration: 3000,
      })
    } catch {
      setError('Decryption failed — wrong passphrase or corrupted data.')
    } finally {
      setIsDecrypting(false)
    }
  }, [decodedMessage, passphrase, toast])

  if (!isConnected) {
    return (
      <Box
        textAlign="center"
        py={20}
        px={8}
        {...card}
        borderStyle="dashed"
        borderColor="rgba(255,255,255,0.08)"
      >
        <Box
          w="56px"
          h="56px"
          borderRadius="16px"
          bg="rgba(99, 102, 241, 0.08)"
          border="1px solid rgba(99, 102, 241, 0.2)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          mb={5}
          fontSize="2xl"
        >
          🔓
        </Box>
        <Text fontSize="md" color="gray.300" fontWeight={600} mb={2}>
          Wallet not connected
        </Text>
        <Text fontSize="sm" color="gray.500" mb={6} maxW="320px" mx="auto">
          Connect your wallet to decode on-chain callout messages.
        </Text>
        <Box display="inline-block">
          <appkit-button />
        </Box>
      </Box>
    )
  }

  return (
    <VStack spacing={5} align="stretch">

      {/* ── CALLDATA INPUT ── */}
      <Box {...card}>
        <Flex align="center" mb={4} gap={3}>
          <Box
            w="28px" h="28px" borderRadius="8px"
            bg="rgba(99, 102, 241, 0.1)"
            border="1px solid rgba(99, 102, 241, 0.2)"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="sm"
          >
            🔍
          </Box>
          <Box>
            <Text fontWeight={600} fontSize="sm" color="gray.200" lineHeight={1}>
              Transaction Calldata
            </Text>
            <Text fontSize="xs" color="gray.600" mt={0.5}>
              Paste the hex input data from any transaction
            </Text>
          </Box>
        </Flex>

        <Textarea
          placeholder="0x48656c6c6f..."
          value={calldataInput}
          onChange={(e) => setCalldataInput(e.target.value)}
          fontFamily="mono"
          fontSize="sm"
          bg="rgba(0,0,0,0.4)"
          borderColor="rgba(255,255,255,0.08)"
          _hover={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}
          _focus={{
            borderColor: 'rgba(99, 102, 241, 0.5)',
            boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.3)',
          }}
          _placeholder={{ color: 'gray.600' }}
          borderRadius="12px"
          rows={4}
          mb={4}
        />

        <Button
          width="full"
          h="48px"
          borderRadius="12px"
          bg="rgba(99, 102, 241, 0.15)"
          color="gray.200"
          border="1px solid rgba(99, 102, 241, 0.3)"
          fontWeight={600}
          fontSize="sm"
          _hover={{
            bg: 'rgba(99, 102, 241, 0.25)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)',
          }}
          _active={{ bg: 'rgba(99, 102, 241, 0.3)' }}
          _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
          isDisabled={!calldataInput.trim()}
          onClick={handleDecode}
          transition="all 0.2s"
        >
          🔓&nbsp;&nbsp;Decode Message
        </Button>
      </Box>

      {/* ── ERROR ── */}
      {error && (
        <Box
          py={3}
          px={4}
          borderRadius="12px"
          bg="rgba(234, 179, 8, 0.06)"
          border="1px solid rgba(234, 179, 8, 0.2)"
        >
          <Flex align="center" gap={2}>
            <Text fontSize="sm">⚠️</Text>
            <Text fontSize="sm" color="yellow.300" fontWeight={500}>
              {error}
            </Text>
          </Flex>
        </Box>
      )}

      {/* ── DECODED RESULT ── */}
      {decodedMessage !== null && (
        <Box {...card} borderColor="rgba(99, 102, 241, 0.15)">
          <Flex align="center" gap={2} mb={4}>
            <Box w="6px" h="6px" borderRadius="full" bg="indigo.400" />
            <Text
              fontSize="xs"
              color="gray.500"
              fontWeight={600}
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Decoded Message
            </Text>
          </Flex>

          <Box
            bg="rgba(0,0,0,0.4)"
            p={5}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.04)"
          >
            <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight={1.7} color="gray.200">
              {decodedMessage}
            </Text>
          </Box>

          {/* Decrypt section for encrypted messages */}
          {isEncryptedMessage(decodedMessage) && (
            <Box mt={5}>
              <Flex align="center" gap={2} mb={3}>
                <Text fontSize="sm">🔒</Text>
                <Text fontSize="sm" color="yellow.300" fontWeight={600}>
                  Encrypted payload — enter passphrase to decrypt
                </Text>
              </Flex>
              <HStack>
                <Input
                  placeholder="Passphrase..."
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  type="password"
                  bg="rgba(0,0,0,0.4)"
                  borderColor="rgba(255,255,255,0.08)"
                  _focus={{
                    borderColor: 'yellow.500',
                    boxShadow: '0 0 0 1px rgba(234,179,8,0.3)',
                  }}
                  h="48px"
                  borderRadius="12px"
                  fontSize="sm"
                />
                <Button
                  h="48px"
                  px={6}
                  borderRadius="12px"
                  bg="rgba(234, 179, 8, 0.15)"
                  color="yellow.200"
                  border="1px solid rgba(234, 179, 8, 0.3)"
                  fontWeight={600}
                  fontSize="sm"
                  _hover={{ bg: 'rgba(234, 179, 8, 0.25)' }}
                  _disabled={{ opacity: 0.4 }}
                  onClick={handleDecrypt}
                  isLoading={isDecrypting}
                  isDisabled={!passphrase}
                >
                  Decrypt
                </Button>
              </HStack>
            </Box>
          )}

          {/* Decrypted result */}
          {decryptedMessage && (
            <Box
              mt={5}
              p={4}
              bg="rgba(34, 197, 94, 0.06)"
              borderRadius="12px"
              border="1px solid rgba(34, 197, 94, 0.2)"
            >
              <Flex align="center" gap={2} mb={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
                <Text
                  fontSize="xs"
                  color="green.400"
                  fontWeight={600}
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                >
                  Decrypted
                </Text>
              </Flex>
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
        </Box>
      )}
    </VStack>
  )
}
