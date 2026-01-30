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
  Code,
  Link,
  Flex,
  Collapse,
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

// Shared card style
const cardStyle = {
  bg: 'rgba(14, 14, 30, 0.6)',
  borderRadius: '2xl',
  border: '1px solid',
  borderColor: 'whiteAlpha.50',
  p: { base: 4, md: 6 },
}

// Section label component
function SectionLabel({ icon, label, accent }: { icon: string; label: string; accent?: string }) {
  return (
    <HStack spacing={2} mb={4}>
      <Text fontSize="md">{icon}</Text>
      <Text
        fontSize="xs"
        fontWeight="800"
        letterSpacing="0.1em"
        textTransform="uppercase"
        color={accent || 'whiteAlpha.500'}
      >
        {label}
      </Text>
    </HStack>
  )
}

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
        title: 'Message Sent On-Chain',
        description: `Tx: ${hash.slice(0, 14)}...`,
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

  // Not connected state
  if (false && !isConnected) {
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
          bg="rgba(220, 38, 38, 0.08)"
          border="1px solid"
          borderColor="rgba(220, 38, 38, 0.15)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          mb={5}
        >
          <Text fontSize="2xl">🔌</Text>
        </Box>
        <Text fontSize="lg" fontWeight="700" color="whiteAlpha.700" mb={2}>
          Wallet Required
        </Text>
        <Text fontSize="sm" color="whiteAlpha.400" mb={6} maxW="300px" mx="auto">
          Connect your wallet to start sending on-chain messages
        </Text>
        <Box display="inline-block">
          <appkit-button />
        </Box>
      </Box>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Target Address */}
      <Box
        {...cardStyle}
        borderColor="rgba(220, 38, 38, 0.15)"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgGradient: 'linear(to-r, transparent, rgba(220,38,38,0.4), transparent)',
        }}
      >
        <SectionLabel icon="⊕" label="Target Address" accent="red.400" />
        <InputGroup size="lg">
          <InputLeftElement
            pointerEvents="none"
            h="full"
          >
            <Text color="red.500" fontSize="sm" fontFamily="mono" opacity={0.6}>
              0x
            </Text>
          </InputLeftElement>
          <Input
            placeholder="Paste scammer address..."
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            fontFamily="mono"
            fontSize="sm"
            bg="rgba(6, 6, 15, 0.8)"
            pl="40px"
            h="48px"
            borderColor={
              targetAddress
                ? isValidTarget
                  ? 'rgba(220, 38, 38, 0.4)'
                  : 'orange.500'
                : 'whiteAlpha.100'
            }
            _hover={{ borderColor: 'rgba(220, 38, 38, 0.3)' }}
            _focus={{
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.3), 0 0 20px rgba(220, 38, 38, 0.1)',
            }}
          />
        </InputGroup>
        {targetAddress && !isValidTarget && (
          <Text fontSize="xs" color="orange.400" mt={2} fontWeight="500">
            ⚠ Invalid address format
          </Text>
        )}
        {isValidTarget && (
          <Text fontSize="xs" color="red.400" mt={2} fontWeight="500" opacity={0.7}>
            ✓ Target locked
          </Text>
        )}
      </Box>

      {/* Return Address */}
      <Box {...cardStyle}>
        <SectionLabel icon="↩" label="Return Address" />
        <Text fontSize="xs" color="whiteAlpha.300" mb={3}>
          Your address for fund recovery. Injected into templates below.
        </Text>
        <Input
          placeholder={walletAddress || '0x...'}
          value={returnAddress}
          onChange={(e) => setReturnAddress(e.target.value)}
          fontFamily="mono"
          fontSize="sm"
          bg="rgba(6, 6, 15, 0.8)"
          h="44px"
          borderColor="whiteAlpha.100"
          _hover={{ borderColor: 'whiteAlpha.200' }}
        />
      </Box>

      {/* Tone Selector */}
      <Box {...cardStyle}>
        <SectionLabel icon="✉" label="Choose Your Tone" />

        <VStack spacing={2} align="stretch">
          {messageTemplates.map((tpl) => {
            const isSelected = selectedTone === tpl.tone
            const colorMap: Record<string, { bg: string; border: string; glow: string; badge: string }> = {
              green: {
                bg: 'rgba(72, 187, 120, 0.08)',
                border: 'rgba(72, 187, 120, 0.35)',
                glow: 'rgba(72, 187, 120, 0.12)',
                badge: 'green',
              },
              yellow: {
                bg: 'rgba(236, 201, 75, 0.08)',
                border: 'rgba(236, 201, 75, 0.35)',
                glow: 'rgba(236, 201, 75, 0.12)',
                badge: 'yellow',
              },
              red: {
                bg: 'rgba(220, 38, 38, 0.08)',
                border: 'rgba(220, 38, 38, 0.35)',
                glow: 'rgba(220, 38, 38, 0.12)',
                badge: 'red',
              },
            }
            const colors = colorMap[tpl.color] || colorMap.red

            return (
              <Box
                key={tpl.tone}
                p={4}
                borderRadius="xl"
                bg={isSelected ? colors.bg : 'rgba(10, 10, 20, 0.5)'}
                border="1px solid"
                borderColor={isSelected ? colors.border : 'whiteAlpha.50'}
                cursor="pointer"
                transition="all 0.25s ease"
                boxShadow={isSelected ? `0 0 25px ${colors.glow}` : 'none'}
                _hover={{
                  borderColor: colors.border,
                  bg: colors.bg,
                  transform: 'translateX(2px)',
                }}
                onClick={() => {
                  setSelectedTone(tpl.tone)
                  setCustomMessage('')
                }}
                role="button"
                tabIndex={0}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack spacing={2}>
                    <Text fontSize="lg">{tpl.emoji}</Text>
                    <Badge
                      colorScheme={colors.badge}
                      variant="solid"
                      fontSize="10px"
                      fontWeight="800"
                      letterSpacing="0.05em"
                      borderRadius="md"
                      px={2}
                    >
                      {tpl.label}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="whiteAlpha.300" fontWeight="500">
                    {tpl.description}
                  </Text>
                </Flex>
                <Text
                  fontSize="sm"
                  color={isSelected ? 'whiteAlpha.700' : 'whiteAlpha.400'}
                  fontStyle="italic"
                  lineHeight="1.5"
                >
                  &ldquo;{applyTemplate(tpl.template, returnAddress || walletAddress || '[address]')}&rdquo;
                </Text>
              </Box>
            )
          })}

          {/* Custom message option */}
          <Box
            p={4}
            borderRadius="xl"
            bg={selectedTone === 'custom' ? 'rgba(159, 122, 234, 0.08)' : 'rgba(10, 10, 20, 0.5)'}
            border="1px solid"
            borderColor={selectedTone === 'custom' ? 'rgba(159, 122, 234, 0.35)' : 'whiteAlpha.50'}
            cursor="pointer"
            transition="all 0.25s ease"
            boxShadow={selectedTone === 'custom' ? '0 0 25px rgba(159, 122, 234, 0.12)' : 'none'}
            _hover={{
              borderColor: 'rgba(159, 122, 234, 0.35)',
              bg: 'rgba(159, 122, 234, 0.08)',
              transform: 'translateX(2px)',
            }}
            onClick={() => setSelectedTone('custom')}
            role="button"
            tabIndex={0}
          >
            <HStack spacing={2} mb={selectedTone === 'custom' ? 3 : 0}>
              <Text fontSize="lg">✍️</Text>
              <Badge
                colorScheme="purple"
                variant="solid"
                fontSize="10px"
                fontWeight="800"
                letterSpacing="0.05em"
                borderRadius="md"
                px={2}
              >
                Custom
              </Badge>
              <Text fontSize="xs" color="whiteAlpha.300" fontWeight="500">
                Write your own message
              </Text>
            </HStack>
            <Collapse in={selectedTone === 'custom'} animateOpacity>
              <Textarea
                placeholder="Type your message to the scammer..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                bg="rgba(6, 6, 15, 0.8)"
                borderColor="whiteAlpha.100"
                fontSize="sm"
                rows={4}
                onClick={(e) => e.stopPropagation()}
                _focus={{
                  borderColor: 'purple.400',
                  boxShadow: '0 0 0 1px rgba(159, 122, 234, 0.3)',
                }}
              />
            </Collapse>
          </Box>
        </VStack>
      </Box>

      {/* Encryption */}
      <Box {...cardStyle}>
        <FormControl display="flex" alignItems="center" mb={encryptEnabled ? 4 : 0}>
          <HStack flex={1} spacing={2}>
            <Text fontSize="md">🔒</Text>
            <FormLabel
              htmlFor="encrypt-toggle"
              mb={0}
              fontSize="xs"
              fontWeight="800"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color="whiteAlpha.500"
            >
              Encrypt Message
            </FormLabel>
          </HStack>
          <Tooltip
            label="Encrypt with a passphrase. Share separately with the recipient."
            placement="top"
            bg="gray.800"
            color="gray.200"
            fontSize="xs"
            borderRadius="md"
          >
            <Box>
              <Switch
                id="encrypt-toggle"
                colorScheme="red"
                isChecked={encryptEnabled}
                onChange={(e) => setEncryptEnabled(e.target.checked)}
              />
            </Box>
          </Tooltip>
        </FormControl>
        <Collapse in={encryptEnabled} animateOpacity>
          <Input
            placeholder="Enter encryption passphrase..."
            value={encryptPassphrase}
            onChange={(e) => setEncryptPassphrase(e.target.value)}
            type="password"
            fontSize="sm"
            bg="rgba(6, 6, 15, 0.8)"
            borderColor="whiteAlpha.100"
            h="44px"
          />
        </Collapse>
      </Box>

      {/* Preview & Send */}
      <Collapse in={!!finalMessage} animateOpacity>
        <Box
          {...cardStyle}
          borderColor="whiteAlpha.100"
          position="relative"
          overflow="hidden"
        >
          <SectionLabel icon="📤" label="Message Preview" />

          {/* Message preview */}
          <Box
            bg="rgba(6, 6, 15, 0.9)"
            p={4}
            borderRadius="xl"
            border="1px solid"
            borderColor="whiteAlpha.50"
            mb={4}
          >
            <Text fontSize="sm" whiteSpace="pre-wrap" color="whiteAlpha.700" lineHeight="1.7">
              {finalMessage}
            </Text>
          </Box>

          {/* Calldata preview */}
          {calldata && (
            <Box mb={4}>
              <Text fontSize="10px" color="whiteAlpha.300" mb={1} fontWeight="600" letterSpacing="0.05em" textTransform="uppercase">
                Calldata · {calldata.length} chars
              </Text>
              <Code
                display="block"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                p={3}
                borderRadius="lg"
                fontSize="xs"
                bg="rgba(6, 6, 15, 0.9)"
                border="1px solid"
                borderColor="whiteAlpha.50"
                color="whiteAlpha.400"
                fontFamily="mono"
              >
                {calldata}
              </Code>
            </Box>
          )}

          {/* Gas estimate */}
          {gasEstimate && (
            <HStack
              mb={4}
              p={3}
              bg="rgba(6, 6, 15, 0.5)"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.50"
            >
              <Text fontSize="xs" color="whiteAlpha.300">⛽ Estimated gas:</Text>
              <Text fontSize="xs" color="whiteAlpha.600" fontFamily="mono" fontWeight="600">
                {gasEstimate.toString()}
              </Text>
            </HStack>
          )}

          {/* Send button */}
          <Button
            size="lg"
            width="full"
            h="56px"
            fontSize="sm"
            fontWeight="800"
            letterSpacing="0.05em"
            textTransform="uppercase"
            isLoading={isSending}
            loadingText="Broadcasting..."
            isDisabled={!isValidTarget || !calldata}
            onClick={handleSend}
            bg="rgba(220, 38, 38, 0.9)"
            color="white"
            borderRadius="xl"
            _hover={{
              bg: 'rgba(220, 38, 38, 1)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 30px rgba(220, 38, 38, 0.4)',
            }}
            _active={{
              transform: 'translateY(0)',
              bg: 'red.700',
            }}
            _disabled={{
              bg: 'whiteAlpha.100',
              color: 'whiteAlpha.300',
              cursor: 'not-allowed',
              _hover: {
                bg: 'whiteAlpha.100',
                transform: 'none',
                boxShadow: 'none',
              },
            }}
            transition="all 0.2s"
            boxShadow="0 2px 20px rgba(220, 38, 38, 0.25)"
          >
            ⊕ Send On-Chain Message
          </Button>

          <Text fontSize="10px" color="whiteAlpha.200" textAlign="center" mt={3}>
            This action is permanent and irreversible. The message will be written to the blockchain forever.
          </Text>

          {/* Transaction result */}
          <Collapse in={!!lastTxHash} animateOpacity>
            {lastTxHash && (
              <Box
                mt={4}
                p={4}
                bg="rgba(72, 187, 120, 0.08)"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(72, 187, 120, 0.25)"
              >
                <HStack mb={2}>
                  <Text fontSize="sm" fontWeight="700" color="green.300">
                    ✓ Message Broadcast
                  </Text>
                </HStack>
                <Code
                  fontSize="xs"
                  bg="transparent"
                  color="green.400"
                  fontFamily="mono"
                  display="block"
                  mb={2}
                  wordBreak="break-all"
                  whiteSpace="normal"
                >
                  {lastTxHash}
                </Code>
                <Link
                  href={getExplorerTxUrl(chainId, lastTxHash)}
                  isExternal
                  color="green.300"
                  fontSize="xs"
                  fontWeight="600"
                  _hover={{ color: 'green.200', textDecoration: 'underline' }}
                >
                  View on Explorer →
                </Link>
              </Box>
            )}
          </Collapse>
        </Box>
      </Collapse>
    </VStack>
  )
}
