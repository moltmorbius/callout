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
  p: { base: 5, md: 6 },
}

// Section label component
function SectionLabel({ icon, label, accent }: { icon: string; label: string; accent?: string }) {
  return (
    <HStack spacing={2.5} mb={4}>
      <Text fontSize="sm" opacity={0.7}>{icon}</Text>
      <Text
        fontSize="11px"
        fontWeight="800"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color={accent || 'whiteAlpha.400'}
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

  // Not connected state (bypassed for dev preview with ?demo)
  const _isDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
  if (!isConnected && !_isDemo) {
    return (
      <Box
        textAlign="center"
        py={{ base: 14, md: 20 }}
        px={6}
        {...cardStyle}
      >
        <Box
          w="56px"
          h="56px"
          borderRadius="xl"
          bg="rgba(220, 38, 38, 0.06)"
          border="1px solid"
          borderColor="rgba(220, 38, 38, 0.12)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          mb={5}
        >
          <Text fontSize="xl">🔌</Text>
        </Box>
        <Text fontSize="md" fontWeight="700" color="whiteAlpha.600" mb={2}>
          Wallet Required
        </Text>
        <Text fontSize="sm" color="whiteAlpha.300" mb={6} maxW="280px" mx="auto" lineHeight="1.6">
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
      {/* ── Target Address ── */}
      <Box
        {...cardStyle}
        borderColor="rgba(220, 38, 38, 0.12)"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgGradient: 'linear(to-r, transparent, rgba(220,38,38,0.5), transparent)',
        }}
      >
        <SectionLabel icon="⊕" label="Target Address" accent="red.400" />
        <InputGroup size="lg">
          <InputLeftElement
            pointerEvents="none"
            h="full"
            pl={1}
          >
            <Text color="red.600" fontSize="xs" fontFamily="mono" fontWeight="600">
              0x
            </Text>
          </InputLeftElement>
          <Input
            placeholder="Paste scammer address..."
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            fontFamily="mono"
            fontSize="sm"
            bg="rgba(6, 6, 15, 0.9)"
            pl="42px"
            h="50px"
            borderColor={
              targetAddress
                ? isValidTarget
                  ? 'rgba(220, 38, 38, 0.35)'
                  : 'orange.500'
                : 'whiteAlpha.100'
            }
            borderRadius="xl"
            _hover={{ borderColor: 'rgba(220, 38, 38, 0.25)' }}
            _focus={{
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.3), 0 0 30px rgba(220, 38, 38, 0.08)',
            }}
            _placeholder={{ color: 'whiteAlpha.200' }}
          />
        </InputGroup>
        {targetAddress && !isValidTarget && (
          <Text fontSize="xs" color="orange.400" mt={2} fontWeight="600">
            ⚠ Invalid address format
          </Text>
        )}
        {isValidTarget && (
          <Text fontSize="xs" color="red.400" mt={2} fontWeight="600" opacity={0.8}>
            ✓ Target locked
          </Text>
        )}
      </Box>

      {/* ── Return Address ── */}
      <Box {...cardStyle}>
        <SectionLabel icon="↩" label="Return Address" />
        <Text fontSize="xs" color="whiteAlpha.250" mb={3} lineHeight="1.5">
          Your address for fund recovery. Injected into message templates.
        </Text>
        <Input
          placeholder={walletAddress || '0x...'}
          value={returnAddress}
          onChange={(e) => setReturnAddress(e.target.value)}
          fontFamily="mono"
          fontSize="sm"
          bg="rgba(6, 6, 15, 0.9)"
          h="46px"
          borderColor="whiteAlpha.100"
          borderRadius="xl"
          _hover={{ borderColor: 'whiteAlpha.200' }}
          _placeholder={{ color: 'whiteAlpha.200' }}
        />
      </Box>

      {/* ── Tone Selector ── */}
      <Box {...cardStyle}>
        <SectionLabel icon="✉" label="Choose Your Tone" />

        <VStack spacing={2.5} align="stretch">
          {messageTemplates.map((tpl) => {
            const isSelected = selectedTone === tpl.tone
            const colorMap: Record<string, { bg: string; border: string; glow: string; text: string; badge: string }> = {
              green: {
                bg: 'rgba(72, 187, 120, 0.07)',
                border: 'rgba(72, 187, 120, 0.3)',
                glow: '0 0 30px rgba(72, 187, 120, 0.1)',
                text: 'green.300',
                badge: 'green',
              },
              yellow: {
                bg: 'rgba(236, 201, 75, 0.07)',
                border: 'rgba(236, 201, 75, 0.3)',
                glow: '0 0 30px rgba(236, 201, 75, 0.1)',
                text: 'yellow.300',
                badge: 'yellow',
              },
              red: {
                bg: 'rgba(220, 38, 38, 0.07)',
                border: 'rgba(220, 38, 38, 0.3)',
                glow: '0 0 30px rgba(220, 38, 38, 0.12)',
                text: 'red.300',
                badge: 'red',
              },
            }
            const colors = colorMap[tpl.color] || colorMap.red

            return (
              <Box
                key={tpl.tone}
                position="relative"
                pl={{ base: 5, md: 6 }}
                pr={{ base: 3.5, md: 4 }}
                py={{ base: 3.5, md: 4 }}
                borderRadius="xl"
                bg={isSelected ? colors.bg : 'rgba(6, 6, 15, 0.5)'}
                border="1px solid"
                borderColor={isSelected ? colors.border : 'whiteAlpha.50'}
                cursor="pointer"
                transition="all 0.2s ease"
                boxShadow={isSelected ? colors.glow : 'none'}
                overflow="hidden"
                _hover={{
                  borderColor: colors.border,
                  bg: colors.bg,
                }}
                _before={{
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '12px',
                  bottom: '12px',
                  width: '3px',
                  borderRadius: '0 3px 3px 0',
                  bg: colors.border,
                  opacity: isSelected ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
                onClick={() => {
                  setSelectedTone(tpl.tone)
                  setCustomMessage('')
                }}
                role="button"
                tabIndex={0}
              >
                <Flex
                  justify="space-between"
                  align="center"
                  mb={2}
                  flexWrap={{ base: 'wrap', md: 'nowrap' }}
                  gap={2}
                >
                  <HStack spacing={2}>
                    <Text fontSize="lg">{tpl.emoji}</Text>
                    <Badge
                      colorScheme={colors.badge}
                      variant="solid"
                      fontSize="10px"
                      fontWeight="800"
                      letterSpacing="0.05em"
                      borderRadius="md"
                      px={2.5}
                      py={0.5}
                    >
                      {tpl.label}
                    </Badge>
                  </HStack>
                  <Text
                    fontSize="xs"
                    color={isSelected ? 'whiteAlpha.500' : 'whiteAlpha.300'}
                    fontWeight="500"
                  >
                    {tpl.description}
                  </Text>
                </Flex>
                <Text
                  fontSize="sm"
                  color={isSelected ? 'whiteAlpha.600' : 'whiteAlpha.300'}
                  fontStyle="italic"
                  lineHeight="1.6"
                  pl={{ base: 0, md: 8 }}
                >
                  &ldquo;{applyTemplate(tpl.template, returnAddress || walletAddress || '[address]')}&rdquo;
                </Text>
              </Box>
            )
          })}

          {/* Custom message option */}
          <Box
            position="relative"
            pl={{ base: 5, md: 6 }}
            pr={{ base: 3.5, md: 4 }}
            py={{ base: 3.5, md: 4 }}
            borderRadius="xl"
            bg={selectedTone === 'custom' ? 'rgba(159, 122, 234, 0.07)' : 'rgba(6, 6, 15, 0.5)'}
            border="1px solid"
            borderColor={selectedTone === 'custom' ? 'rgba(159, 122, 234, 0.3)' : 'whiteAlpha.50'}
            cursor="pointer"
            transition="all 0.2s ease"
            boxShadow={selectedTone === 'custom' ? '0 0 30px rgba(159, 122, 234, 0.1)' : 'none'}
            overflow="hidden"
            _hover={{
              borderColor: 'rgba(159, 122, 234, 0.3)',
              bg: 'rgba(159, 122, 234, 0.07)',
            }}
            _before={{
              content: '""',
              position: 'absolute',
              left: 0,
              top: '12px',
              bottom: '12px',
              width: '3px',
              borderRadius: '0 3px 3px 0',
              bg: 'rgba(159, 122, 234, 0.5)',
              opacity: selectedTone === 'custom' ? 1 : 0.4,
              transition: 'opacity 0.2s',
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
                px={2.5}
                py={0.5}
              >
                Custom
              </Badge>
              <Text fontSize="xs" color="whiteAlpha.300" fontWeight="500">
                Write your own message
              </Text>
            </HStack>
            <Collapse in={selectedTone === 'custom'} animateOpacity>
              <Textarea
                placeholder="Type your message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                bg="rgba(6, 6, 15, 0.9)"
                borderColor="whiteAlpha.100"
                borderRadius="xl"
                fontSize="sm"
                rows={4}
                onClick={(e) => e.stopPropagation()}
                _focus={{
                  borderColor: 'purple.400',
                  boxShadow: '0 0 0 1px rgba(159, 122, 234, 0.3)',
                }}
                _placeholder={{ color: 'whiteAlpha.200' }}
              />
            </Collapse>
          </Box>
        </VStack>
      </Box>

      {/* ── Encryption ── */}
      <Box {...cardStyle}>
        <FormControl display="flex" alignItems="center" mb={encryptEnabled ? 4 : 0}>
          <HStack flex={1} spacing={2.5}>
            <Text fontSize="sm" opacity={0.7}>🔒</Text>
            <FormLabel
              htmlFor="encrypt-toggle"
              mb={0}
              fontSize="11px"
              fontWeight="800"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="whiteAlpha.400"
              cursor="pointer"
            >
              Encrypt Message
            </FormLabel>
          </HStack>
          <Tooltip
            label="Encrypt with a passphrase. Share it separately with the recipient."
            placement="top"
            bg="gray.800"
            color="gray.200"
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
            bg="rgba(6, 6, 15, 0.9)"
            borderColor="whiteAlpha.100"
            borderRadius="xl"
            h="46px"
            _placeholder={{ color: 'whiteAlpha.200' }}
          />
        </Collapse>
      </Box>

      {/* ── Preview & Send ── */}
      <Collapse in={!!finalMessage} animateOpacity>
        <Box
          {...cardStyle}
          borderColor="rgba(220, 38, 38, 0.1)"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgGradient: 'linear(to-r, transparent, rgba(220,38,38,0.3), transparent)',
          }}
        >
          <SectionLabel icon="📤" label="Message Preview" />

          {/* Message text */}
          <Box
            bg="rgba(6, 6, 15, 0.9)"
            p={4}
            borderRadius="xl"
            border="1px solid"
            borderColor="whiteAlpha.50"
            mb={4}
          >
            <Text fontSize="sm" whiteSpace="pre-wrap" color="whiteAlpha.600" lineHeight="1.7">
              {finalMessage}
            </Text>
          </Box>

          {/* Calldata */}
          {calldata && (
            <Box mb={4}>
              <Text
                fontSize="10px"
                color="whiteAlpha.250"
                mb={1.5}
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
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
                color="whiteAlpha.300"
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
              spacing={2}
            >
              <Text fontSize="xs" color="whiteAlpha.300">⛽</Text>
              <Text fontSize="xs" color="whiteAlpha.300">Estimated gas:</Text>
              <Text fontSize="xs" color="whiteAlpha.500" fontFamily="mono" fontWeight="600">
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
            letterSpacing="0.08em"
            textTransform="uppercase"
            isLoading={isSending}
            loadingText="Broadcasting..."
            isDisabled={!isValidTarget || !calldata}
            onClick={handleSend}
            bg={(!isValidTarget || !calldata) ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.9)'}
            color={(!isValidTarget || !calldata) ? 'rgba(220, 38, 38, 0.4)' : 'white'}
            border="1px solid"
            borderColor={(!isValidTarget || !calldata) ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.4)'}
            borderRadius="xl"
            _hover={{
              bg: 'red.600',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 40px rgba(220, 38, 38, 0.35)',
            }}
            _active={{
              transform: 'translateY(0)',
              bg: 'red.700',
            }}
            _disabled={{
              cursor: 'not-allowed',
              opacity: 1,
              _hover: {
                transform: 'none',
                boxShadow: 'none',
                bg: 'rgba(220, 38, 38, 0.15)',
              },
            }}
            transition="all 0.2s"
            boxShadow={(!isValidTarget || !calldata) ? 'none' : '0 2px 25px rgba(220, 38, 38, 0.25)'}
          >
            ⊕ Send On-Chain Message
          </Button>

          <Text fontSize="10px" color="whiteAlpha.150" textAlign="center" mt={3} lineHeight="1.5">
            This action is permanent and irreversible. Your message will be inscribed on the blockchain forever.
          </Text>

          {/* Transaction result */}
          <Collapse in={!!lastTxHash} animateOpacity>
            {lastTxHash && (
              <Box
                mt={5}
                p={5}
                bg="rgba(72, 187, 120, 0.06)"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(72, 187, 120, 0.2)"
              >
                <HStack mb={3}>
                  <Box
                    w="24px"
                    h="24px"
                    borderRadius="full"
                    bg="rgba(72, 187, 120, 0.15)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="xs" color="green.400">✓</Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="700" color="green.300">
                    Message Broadcast Successfully
                  </Text>
                </HStack>
                <Code
                  fontSize="xs"
                  bg="rgba(6, 6, 15, 0.5)"
                  color="green.400"
                  fontFamily="mono"
                  display="block"
                  p={3}
                  borderRadius="lg"
                  mb={3}
                  wordBreak="break-all"
                  whiteSpace="normal"
                  border="1px solid"
                  borderColor="rgba(72, 187, 120, 0.1)"
                >
                  {lastTxHash}
                </Code>
                <Link
                  href={getExplorerTxUrl(chainId, lastTxHash)}
                  isExternal
                  color="green.300"
                  fontSize="xs"
                  fontWeight="700"
                  letterSpacing="0.03em"
                  _hover={{ color: 'green.200', textDecoration: 'underline' }}
                >
                  View on Block Explorer →
                </Link>
              </Box>
            )}
          </Collapse>
        </Box>
      </Collapse>
    </VStack>
  )
}
