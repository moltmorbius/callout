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
  Collapse,
  SimpleGrid,
} from '@chakra-ui/react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount, useEstimateGas, useSendTransaction, useChainId } from 'wagmi'
import { type Address, isAddress, parseEther } from 'viem'
import { keyframes } from '@emotion/react'
import {
  messageTemplates,
  applyTemplate,
  type MessageTone,
} from '../config/templates'
import { encodeMessage } from '../utils/encoding'
import { encryptMessage } from '../utils/encryption'
import { getExplorerTxUrl } from '../config/web3'
import { cardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'

const targetGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.3), 0 0 20px rgba(220, 38, 38, 0.06); }
  50% { box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.5), 0 0 40px rgba(220, 38, 38, 0.12); }
`

// Tone card color config
const toneColors: Record<string, {
  bg: string; bgHover: string; border: string; glow: string;
  text: string; badge: string; iconBg: string
}> = {
  green: {
    bg: 'rgba(72, 187, 120, 0.06)',
    bgHover: 'rgba(72, 187, 120, 0.1)',
    border: 'rgba(72, 187, 120, 0.35)',
    glow: '0 0 30px rgba(72, 187, 120, 0.12), 0 0 60px rgba(72, 187, 120, 0.05)',
    text: 'green.300',
    badge: 'green',
    iconBg: 'rgba(72, 187, 120, 0.12)',
  },
  yellow: {
    bg: 'rgba(236, 201, 75, 0.06)',
    bgHover: 'rgba(236, 201, 75, 0.1)',
    border: 'rgba(236, 201, 75, 0.35)',
    glow: '0 0 30px rgba(236, 201, 75, 0.12), 0 0 60px rgba(236, 201, 75, 0.05)',
    text: 'yellow.300',
    badge: 'yellow',
    iconBg: 'rgba(236, 201, 75, 0.12)',
  },
  red: {
    bg: 'rgba(220, 38, 38, 0.06)',
    bgHover: 'rgba(220, 38, 38, 0.1)',
    border: 'rgba(220, 38, 38, 0.35)',
    glow: '0 0 30px rgba(220, 38, 38, 0.15), 0 0 60px rgba(220, 38, 38, 0.06)',
    text: 'red.300',
    badge: 'red',
    iconBg: 'rgba(220, 38, 38, 0.12)',
  },
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
        borderColor="rgba(220, 38, 38, 0.15)"
        position="relative"
        overflow="hidden"
        animation={targetAddress && isValidTarget ? `${targetGlow} 2.5s ease-in-out infinite` : undefined}
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          bgGradient: 'linear(to-r, transparent, rgba(220,38,38,0.6), transparent)',
        }}
      >
        <SectionLabel icon="🎯" label="Target Address" accent="red.400" />
        <InputGroup size="lg">
          <InputLeftElement
            pointerEvents="none"
            h="full"
            pl={1}
          >
            <Text color="red.500" fontSize="xs" fontFamily="mono" fontWeight="700">
              0x
            </Text>
          </InputLeftElement>
          <Input
            placeholder="Paste scammer address..."
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            aria-label="Target wallet address"
            fontFamily="mono"
            fontSize="sm"
            bg="rgba(6, 6, 15, 0.9)"
            pl="42px"
            h="54px"
            borderColor={
              targetAddress
                ? isValidTarget
                  ? 'rgba(220, 38, 38, 0.4)'
                  : 'orange.500'
                : 'whiteAlpha.100'
            }
            borderRadius="xl"
            borderWidth="1.5px"
            _hover={{ borderColor: 'rgba(220, 38, 38, 0.3)' }}
            _focus={{
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.4), 0 0 30px rgba(220, 38, 38, 0.1)',
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
          <HStack mt={2} spacing={1.5}>
            <Box w="6px" h="6px" borderRadius="full" bg="red.400" />
            <Text fontSize="xs" color="red.400" fontWeight="700" letterSpacing="0.03em">
              Target locked
            </Text>
          </HStack>
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
          aria-label="Return wallet address for fund recovery"
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

      {/* ── Tone Selector — 3 Visual Cards ── */}
      <Box {...cardStyle}>
        <SectionLabel icon="✉" label="Choose Your Tone" />

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
          {messageTemplates.map((tpl) => {
            const isSelected = selectedTone === tpl.tone
            const colors = toneColors[tpl.color] || toneColors.red

            return (
              <Box
                key={tpl.tone}
                position="relative"
                p={4}
                borderRadius="xl"
                bg={isSelected ? colors.bg : 'rgba(6, 6, 15, 0.5)'}
                border="2px solid"
                borderColor={isSelected ? colors.border : 'whiteAlpha.50'}
                cursor="pointer"
                transition="all 0.25s ease"
                boxShadow={isSelected ? colors.glow : 'none'}
                textAlign="center"
                _hover={{
                  borderColor: colors.border,
                  bg: colors.bgHover,
                  transform: 'translateY(-2px)',
                  boxShadow: colors.glow,
                }}
                _active={{ transform: 'translateY(0)' }}
                onClick={() => {
                  setSelectedTone(tpl.tone)
                  setCustomMessage('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedTone(tpl.tone)
                    setCustomMessage('')
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${tpl.label} tone: ${tpl.description}`}
                aria-pressed={isSelected}
              >
                {/* Big emoji icon */}
                <Box
                  w="48px"
                  h="48px"
                  borderRadius="xl"
                  bg={colors.iconBg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={3}
                  border="1px solid"
                  borderColor={isSelected ? colors.border : 'transparent'}
                  transition="all 0.2s"
                >
                  <Text fontSize="xl">{tpl.emoji}</Text>
                </Box>

                {/* Tone name */}
                <Badge
                  colorScheme={colors.badge}
                  variant="solid"
                  fontSize="10px"
                  fontWeight="800"
                  letterSpacing="0.08em"
                  borderRadius="md"
                  px={3}
                  py={0.5}
                  mb={2}
                >
                  {tpl.label}
                </Badge>

                {/* Short description */}
                <Text
                  fontSize="11px"
                  color={isSelected ? 'whiteAlpha.500' : 'whiteAlpha.300'}
                  lineHeight="1.4"
                  mt={1}
                >
                  {tpl.description}
                </Text>

                {/* Selected indicator */}
                {isSelected && (
                  <Box
                    position="absolute"
                    top={2}
                    right={2}
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={colors.border}
                    boxShadow={`0 0 8px ${colors.border}`}
                  />
                )}
              </Box>
            )
          })}
        </SimpleGrid>

        {/* Message preview for selected tone */}
        <Collapse in={selectedTone !== null && selectedTone !== 'custom'} animateOpacity>
          {selectedTone && selectedTone !== 'custom' && (
            <Box
              bg="rgba(6, 6, 15, 0.7)"
              p={4}
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.50"
              mb={3}
            >
              <Text fontSize="10px" color="whiteAlpha.300" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                Preview
              </Text>
              <Text fontSize="sm" color="whiteAlpha.500" fontStyle="italic" lineHeight="1.7">
                &ldquo;{finalMessage}&rdquo;
              </Text>
            </Box>
          )}
        </Collapse>

        {/* Custom message option */}
        <Box
          p={4}
          borderRadius="xl"
          bg={selectedTone === 'custom' ? 'rgba(159, 122, 234, 0.07)' : 'rgba(6, 6, 15, 0.5)'}
          border={selectedTone === 'custom' ? '2px solid' : '1px dashed'}
          borderColor={selectedTone === 'custom' ? 'rgba(159, 122, 234, 0.35)' : 'whiteAlpha.100'}
          cursor="pointer"
          transition="all 0.2s ease"
          boxShadow={selectedTone === 'custom' ? '0 0 30px rgba(159, 122, 234, 0.1)' : 'none'}
          _hover={{
            borderColor: 'rgba(159, 122, 234, 0.3)',
            bg: 'rgba(159, 122, 234, 0.07)',
          }}
          onClick={() => setSelectedTone('custom')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setSelectedTone('custom')
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Write a custom message"
          aria-pressed={selectedTone === 'custom'}
        >
          <HStack spacing={2} mb={selectedTone === 'custom' ? 3 : 0} justify="center">
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
            aria-label="Encryption passphrase"
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
          borderColor="rgba(220, 38, 38, 0.15)"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            bgGradient: 'linear(to-r, transparent, rgba(220,38,38,0.5), transparent)',
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

          {/* Send button — Big, red, consequential */}
          <Button
            size="lg"
            width="full"
            h="60px"
            fontSize="md"
            fontWeight="900"
            letterSpacing="0.1em"
            textTransform="uppercase"
            isLoading={isSending}
            loadingText="Broadcasting..."
            isDisabled={!isValidTarget || !calldata}
            onClick={handleSend}
            bg={(!isValidTarget || !calldata) ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.9)'}
            color={(!isValidTarget || !calldata) ? 'rgba(220, 38, 38, 0.4)' : 'white'}
            border="2px solid"
            borderColor={(!isValidTarget || !calldata) ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.5)'}
            borderRadius="xl"
            _hover={{
              bg: 'red.600',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 50px rgba(220, 38, 38, 0.4), 0 0 80px rgba(220, 38, 38, 0.15)',
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
            boxShadow={(!isValidTarget || !calldata) ? 'none' : '0 4px 30px rgba(220, 38, 38, 0.3)'}
          >
            ⚠️ Send On-Chain — Permanent
          </Button>

          <Text fontSize="10px" color="whiteAlpha.200" textAlign="center" mt={3} lineHeight="1.5">
            This is irreversible. Your message will be inscribed on the blockchain forever.
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
