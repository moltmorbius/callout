import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  Badge,
  InputGroup,
  InputLeftElement,
  Switch,
  FormControl,
  FormLabel,
  useToast,
  Tooltip,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Code,
  Link,
} from '@chakra-ui/react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount, useEstimateGas, useSendTransaction, useChainId } from 'wagmi'
import { type Address, isAddress, parseEther } from 'viem'
import {
  messageTemplates,
  applyTemplate,
  type MessageTone,
} from '../config/templates'
import { encodeMessage } from '../utils/encoding'
import { encryptMessage } from '../utils/encryption'
import { getExplorerTxUrl } from '../config/web3'

export function MessageComposer() {
  const { isConnected, address: walletAddress } = useAccount()
  const chainId = useChainId()
  const toast = useToast()

  const [targetAddress, setTargetAddress] = useState('')
  const [returnAddress, setReturnAddress] = useState('')
  const [selectedTone, setSelectedTone] = useState<MessageTone | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [encryptEnabled, setEncryptEnabled] = useState(false)
  const [encryptPassphrase, setEncryptPassphrase] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)

  // Build the final message
  const finalMessage = useMemo(() => {
    if (selectedTone === 'custom') return customMessage
    const tpl = messageTemplates.find((t) => t.tone === selectedTone)
    if (!tpl) return ''
    return applyTemplate(tpl.template, returnAddress || walletAddress || '[address]')
  }, [selectedTone, customMessage, returnAddress, walletAddress])

  // Encode to calldata
  const [calldata, setCalldata] = useState<`0x${string}` | undefined>(undefined)

  useEffect(() => {
    if (!finalMessage) {
      setCalldata(undefined)
      return
    }
    // Handle async encryption
    if (encryptEnabled && encryptPassphrase) {
      encryptMessage(finalMessage, encryptPassphrase).then((encrypted) => {
        setCalldata(encodeMessage(encrypted))
      })
    } else {
      setCalldata(encodeMessage(finalMessage))
    }
  }, [finalMessage, encryptEnabled, encryptPassphrase])

  const isValidTarget = targetAddress ? isAddress(targetAddress) : false

  // Gas estimation
  const { data: gasEstimate } = useEstimateGas(
    isValidTarget && calldata
      ? {
          to: targetAddress as Address,
          data: calldata,
          value: parseEther('0'),
        }
      : undefined
  )

  // Send transaction
  const { sendTransactionAsync } = useSendTransaction()

  const handleSend = useCallback(async () => {
    if (!isValidTarget || !calldata) return

    setIsSending(true)
    try {
      const hash = await sendTransactionAsync({
        to: targetAddress as Address,
        data: calldata,
        value: parseEther('0'),
      })
      setLastTxHash(hash)
      toast({
        title: 'Message Sent!',
        description: `Transaction: ${hash.slice(0, 10)}...`,
        status: 'success',
        duration: 10000,
        isClosable: true,
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      toast({
        title: 'Transaction Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSending(false)
    }
  }, [isValidTarget, calldata, targetAddress, sendTransactionAsync, toast])

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
          🔌
        </Text>
        <Text fontSize="lg" color="gray.400">
          Connect your wallet to start sending on-chain messages
        </Text>
        <Box mt={4}>
          <appkit-button />
        </Box>
      </Box>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Target Address */}
      <Box
        bg="whiteAlpha.50"
        borderRadius="xl"
        p={5}
        border="1px solid"
        borderColor="red.900"
      >
        <HStack mb={3}>
          <Text fontSize="lg">😠</Text>
          <Text fontWeight="bold" color="red.300">
            Target Address
          </Text>
        </HStack>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="red.400">
            ⚠
          </InputLeftElement>
          <Input
            placeholder="0x... scammer address"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            fontFamily="mono"
            bg="blackAlpha.400"
            borderColor={
              targetAddress
                ? isValidTarget
                  ? 'red.600'
                  : 'orange.500'
                : 'whiteAlpha.200'
            }
            _hover={{ borderColor: 'red.500' }}
            _focus={{ borderColor: 'red.400', boxShadow: '0 0 0 1px #e53e3e' }}
          />
        </InputGroup>
        {targetAddress && !isValidTarget && (
          <Text fontSize="xs" color="orange.400" mt={1}>
            Invalid Ethereum address
          </Text>
        )}
      </Box>

      {/* Return Address */}
      <Box bg="whiteAlpha.50" borderRadius="xl" p={5} border="1px solid" borderColor="whiteAlpha.100">
        <HStack mb={3}>
          <Text fontSize="lg">↩️</Text>
          <Text fontWeight="bold" color="gray.300">
            Return Address
          </Text>
          <Text fontSize="xs" color="gray.500">
            (injected into templates)
          </Text>
        </HStack>
        <Input
          placeholder={walletAddress || '0x... your address'}
          value={returnAddress}
          onChange={(e) => setReturnAddress(e.target.value)}
          fontFamily="mono"
          bg="blackAlpha.400"
          borderColor="whiteAlpha.200"
          _hover={{ borderColor: 'whiteAlpha.400' }}
        />
      </Box>

      {/* Message Templates */}
      <Box bg="whiteAlpha.50" borderRadius="xl" p={5} border="1px solid" borderColor="whiteAlpha.100">
        <HStack mb={4}>
          <Text fontSize="lg">✉️</Text>
          <Text fontWeight="bold" color="gray.300">
            Message
          </Text>
        </HStack>

        <VStack spacing={3} align="stretch" mb={4}>
          {messageTemplates.map((tpl) => (
            <Box
              key={tpl.tone}
              p={4}
              borderRadius="lg"
              bg={selectedTone === tpl.tone ? `${tpl.color}.900` : 'blackAlpha.400'}
              border="1px solid"
              borderColor={
                selectedTone === tpl.tone
                  ? `${tpl.color}.500`
                  : 'whiteAlpha.100'
              }
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                borderColor: `${tpl.color}.400`,
                bg: `${tpl.color}.900`,
              }}
              onClick={() => {
                setSelectedTone(tpl.tone)
                setCustomMessage('')
              }}
            >
              <HStack justify="space-between" mb={1}>
                <HStack>
                  <Text>{tpl.emoji}</Text>
                  <Badge colorScheme={tpl.color} variant="solid" fontSize="xs">
                    {tpl.label}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {tpl.description}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.300" fontStyle="italic">
                "{applyTemplate(tpl.template, returnAddress || walletAddress || '[address]')}"
              </Text>
            </Box>
          ))}

          {/* Custom */}
          <Box
            p={4}
            borderRadius="lg"
            bg={selectedTone === 'custom' ? 'purple.900' : 'blackAlpha.400'}
            border="1px solid"
            borderColor={
              selectedTone === 'custom' ? 'purple.500' : 'whiteAlpha.100'
            }
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: 'purple.400',
              bg: 'purple.900',
            }}
            onClick={() => setSelectedTone('custom')}
          >
            <HStack mb={2}>
              <Text>✍️</Text>
              <Badge colorScheme="purple" variant="solid" fontSize="xs">
                Custom
              </Badge>
              <Text fontSize="xs" color="gray.500">
                Write your own message
              </Text>
            </HStack>
            {selectedTone === 'custom' && (
              <Textarea
                placeholder="Type your message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                bg="blackAlpha.500"
                borderColor="whiteAlpha.200"
                mt={2}
                rows={4}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </Box>
        </VStack>
      </Box>

      {/* Encryption */}
      <Box bg="whiteAlpha.50" borderRadius="xl" p={5} border="1px solid" borderColor="whiteAlpha.100">
        <FormControl display="flex" alignItems="center" mb={encryptEnabled ? 3 : 0}>
          <HStack flex={1}>
            <Text fontSize="lg">🔒</Text>
            <FormLabel htmlFor="encrypt-toggle" mb={0} fontWeight="bold" color="gray.300">
              Encrypt Message
            </FormLabel>
          </HStack>
          <Tooltip label="Encrypt the message with a passphrase. Share the passphrase with the recipient separately.">
            <Switch
              id="encrypt-toggle"
              colorScheme="red"
              isChecked={encryptEnabled}
              onChange={(e) => setEncryptEnabled(e.target.checked)}
            />
          </Tooltip>
        </FormControl>
        {encryptEnabled && (
          <Input
            placeholder="Enter encryption passphrase..."
            value={encryptPassphrase}
            onChange={(e) => setEncryptPassphrase(e.target.value)}
            type="password"
            bg="blackAlpha.400"
            borderColor="whiteAlpha.200"
          />
        )}
      </Box>

      {/* Preview & Send */}
      {finalMessage && (
        <Box bg="whiteAlpha.50" borderRadius="xl" p={5} border="1px solid" borderColor="whiteAlpha.100">
          <Text fontWeight="bold" color="gray.300" mb={3}>
            📤 Message Preview
          </Text>
          <Box bg="blackAlpha.500" p={4} borderRadius="md" mb={4}>
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {finalMessage}
            </Text>
          </Box>

          {calldata && (
            <>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Calldata ({calldata.length} chars):
              </Text>
              <Code
                display="block"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                p={2}
                borderRadius="md"
                fontSize="xs"
                bg="blackAlpha.500"
                mb={4}
              >
                {calldata}
              </Code>
            </>
          )}

          <Divider borderColor="whiteAlpha.100" mb={4} />

          {gasEstimate && (
            <Stat mb={4}>
              <StatLabel color="gray.500">Estimated Gas</StatLabel>
              <StatNumber fontSize="md" color="gray.300">
                {gasEstimate.toString()} gas units
              </StatNumber>
              <StatHelpText color="gray.500">
                0 value transfer + calldata
              </StatHelpText>
            </Stat>
          )}

          <Button
            size="lg"
            width="full"
            colorScheme="red"
            isLoading={isSending}
            loadingText="Sending..."
            isDisabled={!isValidTarget || !calldata}
            onClick={handleSend}
            leftIcon={<Text>🚀</Text>}
          >
            Send On-Chain Message
          </Button>

          {lastTxHash && (
            <Box mt={4} p={3} bg="green.900" borderRadius="md" border="1px solid" borderColor="green.600">
              <Text fontSize="sm" color="green.200" mb={1}>
                ✅ Transaction Sent!
              </Text>
              <Code fontSize="xs" bg="transparent" color="green.300">
                {lastTxHash}
              </Code>
              <Box mt={2}>
                <Link
                  href={getExplorerTxUrl(chainId, lastTxHash)}
                  isExternal
                  color="green.300"
                  fontSize="sm"
                  textDecoration="underline"
                >
                  View on Explorer →
                </Link>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  )
}
