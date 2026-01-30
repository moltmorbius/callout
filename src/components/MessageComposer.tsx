import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  Badge,
  Switch,
  FormControl,
  FormLabel,
  useToast,
  Tooltip,
  Code,
  Link,
  Flex,
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
const card = {
  bg: 'rgba(255,255,255,0.02)',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.06)',
  p: 6,
  transition: 'all 0.2s',
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

  const finalMessage = useMemo(() => {
    if (selectedTone === 'custom') return customMessage
    const tpl = messageTemplates.find((t) => t.tone === selectedTone)
    if (!tpl) return ''
    return applyTemplate(tpl.template, returnAddress || walletAddress || '[address]')
  }, [selectedTone, customMessage, returnAddress, walletAddress])

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

  const { data: gasEstimate } = useEstimateGas(
    isValidTarget && calldata
      ? {
          to: targetAddress as Address,
          data: calldata,
          value: parseEther('0'),
        }
      : undefined
  )

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
        title: 'Callout sent.',
        description: `Tx: ${hash.slice(0, 14)}…`,
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

  /* Not connected state */
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
          bg="rgba(220, 38, 38, 0.08)"
          border="1px solid rgba(220, 38, 38, 0.2)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          mb={5}
          fontSize="2xl"
        >
          🔌
        </Box>
        <Text fontSize="md" color="gray.300" fontWeight={600} mb={2}>
          Wallet not connected
        </Text>
        <Text fontSize="sm" color="gray.500" mb={6} maxW="320px" mx="auto">
          Connect your wallet to start sending permanent on-chain callouts.
        </Text>
        <Box display="inline-block">
          <appkit-button />
        </Box>
      </Box>
    )
  }

  /* Tone color mapping for left-bar accent */
  const toneAccent: Record<string, string> = {
    cordial: '#22c55e',
    firm: '#eab308',
    hostile: '#ef4444',
    custom: '#a855f7',
  }

  return (
    <VStack spacing={5} align="stretch">

      {/* ── TARGET ADDRESS ── */}
      <Box
        {...card}
        borderColor={
          targetAddress
            ? isValidTarget
              ? 'rgba(220, 38, 38, 0.4)'
              : 'rgba(234, 179, 8, 0.4)'
            : 'rgba(255,255,255,0.06)'
        }
        boxShadow={
          isValidTarget
            ? '0 0 30px rgba(220, 38, 38, 0.08), inset 0 1px 0 rgba(220, 38, 38, 0.1)'
            : 'none'
        }
        _hover={{
          borderColor: targetAddress
            ? undefined
            : 'rgba(220, 38, 38, 0.2)',
        }}
      >
        <Flex align="center" mb={4} gap={3}>
          <Box
            w="28px" h="28px" borderRadius="8px"
            bg="rgba(220, 38, 38, 0.1)"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="sm"
          >
            🎯
          </Box>
          <Box>
            <Text fontWeight={600} fontSize="sm" color="gray.200" lineHeight={1}>
              Target Address
            </Text>
            <Text fontSize="xs" color="gray.600" mt={0.5}>
              The address that will receive this callout
            </Text>
          </Box>
        </Flex>
        <Input
          placeholder="0x..."
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          fontFamily="mono"
          fontSize="sm"
          bg="rgba(0,0,0,0.4)"
          borderColor={
            targetAddress
              ? isValidTarget
                ? 'rgba(220, 38, 38, 0.5)'
                : 'rgba(234, 179, 8, 0.5)'
              : 'rgba(255,255,255,0.08)'
          }
          _hover={{ borderColor: 'rgba(220, 38, 38, 0.3)' }}
          _focus={{
            borderColor: 'red.500',
            boxShadow: '0 0 0 1px rgba(220,38,38,0.4), 0 0 20px rgba(220,38,38,0.1)',
          }}
          _placeholder={{ color: 'gray.600' }}
          h="48px"
          borderRadius="12px"
        />
        {targetAddress && !isValidTarget && (
          <Text fontSize="xs" color="yellow.400" mt={2} fontWeight={500}>
            ⚠ Invalid address format
          </Text>
        )}
      </Box>

      {/* ── RETURN ADDRESS ── */}
      <Box {...card}>
        <Flex align="center" mb={4} gap={3}>
          <Box
            w="28px" h="28px" borderRadius="8px"
            bg="rgba(255,255,255,0.04)"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="sm"
          >
            ↩️
          </Box>
          <Box>
            <Text fontWeight={600} fontSize="sm" color="gray.200" lineHeight={1}>
              Return Address
            </Text>
            <Text fontSize="xs" color="gray.600" mt={0.5}>
              Injected into message templates as the return destination
            </Text>
          </Box>
        </Flex>
        <Input
          placeholder={walletAddress || '0x...'}
          value={returnAddress}
          onChange={(e) => setReturnAddress(e.target.value)}
          fontFamily="mono"
          fontSize="sm"
          bg="rgba(0,0,0,0.4)"
          borderColor="rgba(255,255,255,0.08)"
          _hover={{ borderColor: 'rgba(255,255,255,0.16)' }}
          _focus={{
            borderColor: 'gray.500',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
          }}
          _placeholder={{ color: 'gray.600' }}
          h="48px"
          borderRadius="12px"
        />
      </Box>

      {/* ── MESSAGE TONE ── */}
      <Box {...card}>
        <Flex align="center" mb={5} gap={3}>
          <Box
            w="28px" h="28px" borderRadius="8px"
            bg="rgba(255,255,255,0.04)"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="sm"
          >
            ✉️
          </Box>
          <Text fontWeight={600} fontSize="sm" color="gray.200">
            Choose Your Tone
          </Text>
        </Flex>

        <VStack spacing={3} align="stretch">
          {messageTemplates.map((tpl) => {
            const isSelected = selectedTone === tpl.tone
            const accent = toneAccent[tpl.tone]
            return (
              <Box
                key={tpl.tone}
                position="relative"
                pl={5}
                pr={5}
                py={4}
                borderRadius="12px"
                bg={isSelected ? `rgba(${tpl.color === 'green' ? '34,197,94' : tpl.color === 'yellow' ? '234,179,8' : '239,68,68'},0.06)` : 'rgba(0,0,0,0.25)'}
                border="1px solid"
                borderColor={isSelected ? `rgba(${tpl.color === 'green' ? '34,197,94' : tpl.color === 'yellow' ? '234,179,8' : '239,68,68'},0.3)` : 'rgba(255,255,255,0.04)'}
                cursor="pointer"
                transition="all 0.2s ease"
                _hover={{
                  borderColor: `rgba(${tpl.color === 'green' ? '34,197,94' : tpl.color === 'yellow' ? '234,179,8' : '239,68,68'},0.25)`,
                  bg: `rgba(${tpl.color === 'green' ? '34,197,94' : tpl.color === 'yellow' ? '234,179,8' : '239,68,68'},0.04)`,
                }}
                onClick={() => {
                  setSelectedTone(tpl.tone)
                  setCustomMessage('')
                }}
                _before={{
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '12px',
                  bottom: '12px',
                  width: '3px',
                  borderRadius: '0 3px 3px 0',
                  bg: accent,
                  opacity: isSelected ? 1 : 0.3,
                  transition: 'opacity 0.2s',
                }}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack spacing={2}>
                    <Text fontSize="sm">{tpl.emoji}</Text>
                    <Badge
                      colorScheme={tpl.color}
                      variant={isSelected ? 'solid' : 'subtle'}
                      fontSize="10px"
                      px={2}
                      py={0.5}
                      borderRadius="6px"
                      fontWeight={600}
                      letterSpacing="0.03em"
                    >
                      {tpl.label}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" fontWeight={500}>
                    {tpl.description}
                  </Text>
                </Flex>
                <Text fontSize="sm" color="gray.400" fontStyle="italic" lineHeight={1.6}>
                  "{applyTemplate(tpl.template, returnAddress || walletAddress || '[address]')}"
                </Text>
              </Box>
            )
          })}

          {/* Custom */}
          <Box
            position="relative"
            pl={5}
            pr={5}
            py={4}
            borderRadius="12px"
            bg={selectedTone === 'custom' ? 'rgba(168,85,247,0.06)' : 'rgba(0,0,0,0.25)'}
            border="1px solid"
            borderColor={selectedTone === 'custom' ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.04)'}
            cursor="pointer"
            transition="all 0.2s ease"
            _hover={{
              borderColor: 'rgba(168,85,247,0.25)',
              bg: 'rgba(168,85,247,0.04)',
            }}
            onClick={() => setSelectedTone('custom')}
            _before={{
              content: '""',
              position: 'absolute',
              left: 0,
              top: '12px',
              bottom: '12px',
              width: '3px',
              borderRadius: '0 3px 3px 0',
              bg: '#a855f7',
              opacity: selectedTone === 'custom' ? 1 : 0.3,
              transition: 'opacity 0.2s',
            }}
          >
            <HStack spacing={2} mb={selectedTone === 'custom' ? 3 : 0}>
              <Text fontSize="sm">✍️</Text>
              <Badge
                colorScheme="purple"
                variant={selectedTone === 'custom' ? 'solid' : 'subtle'}
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="6px"
                fontWeight={600}
                letterSpacing="0.03em"
              >
                Custom
              </Badge>
              <Text fontSize="xs" color="gray.500" fontWeight={500}>
                Write your own message
              </Text>
            </HStack>
            {selectedTone === 'custom' && (
              <Textarea
                placeholder="Type your message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                bg="rgba(0,0,0,0.4)"
                borderColor="rgba(255,255,255,0.08)"
                _hover={{ borderColor: 'rgba(168,85,247,0.3)' }}
                _focus={{
                  borderColor: 'purple.400',
                  boxShadow: '0 0 0 1px rgba(168,85,247,0.3)',
                }}
                borderRadius="10px"
                rows={4}
                fontSize="sm"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </Box>
        </VStack>
      </Box>

      {/* ── ENCRYPTION ── */}
      <Box {...card}>
        <FormControl display="flex" alignItems="center" mb={encryptEnabled ? 4 : 0}>
          <HStack flex={1} spacing={3}>
            <Box
              w="28px" h="28px" borderRadius="8px"
              bg="rgba(255,255,255,0.04)"
              display="flex" alignItems="center" justifyContent="center"
              fontSize="sm"
            >
              🔒
            </Box>
            <Box>
              <FormLabel htmlFor="encrypt-toggle" mb={0} fontWeight={600} fontSize="sm" color="gray.200">
                Encrypt Message
              </FormLabel>
              <Text fontSize="xs" color="gray.600">
                AES-256-GCM — share passphrase separately
              </Text>
            </Box>
          </HStack>
          <Tooltip label="Encrypt the message with a shared passphrase" placement="top">
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
            bg="rgba(0,0,0,0.4)"
            borderColor="rgba(255,255,255,0.08)"
            _focus={{
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px rgba(220,38,38,0.3)',
            }}
            h="48px"
            borderRadius="12px"
            fontSize="sm"
          />
        )}
      </Box>

      {/* ── PREVIEW & SEND ── */}
      {finalMessage && (
        <Box
          {...card}
          borderColor="rgba(220, 38, 38, 0.15)"
          boxShadow="0 0 40px rgba(220, 38, 38, 0.05)"
        >
          {/* Preview label */}
          <Flex align="center" gap={2} mb={4}>
            <Box w="6px" h="6px" borderRadius="full" bg="red.500" />
            <Text
              fontSize="xs"
              color="gray.500"
              fontWeight={600}
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Preview
            </Text>
          </Flex>

          {/* Message content */}
          <Box
            bg="rgba(0,0,0,0.4)"
            p={5}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.04)"
            mb={4}
          >
            <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight={1.7} color="gray.200">
              {finalMessage}
            </Text>
          </Box>

          {/* Calldata */}
          {calldata && (
            <Box mb={4}>
              <Text fontSize="xs" color="gray.600" mb={1} fontWeight={500}>
                Calldata · {calldata.length} chars
              </Text>
              <Code
                display="block"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                p={3}
                borderRadius="10px"
                fontSize="xs"
                bg="rgba(0,0,0,0.5)"
                border="1px solid rgba(255,255,255,0.04)"
                color="gray.500"
                fontFamily="mono"
              >
                {calldata}
              </Code>
            </Box>
          )}

          {/* Gas */}
          {gasEstimate && (
            <Flex
              justify="space-between"
              align="center"
              py={3}
              px={4}
              borderRadius="10px"
              bg="rgba(255,255,255,0.02)"
              border="1px solid rgba(255,255,255,0.04)"
              mb={5}
            >
              <Text fontSize="xs" color="gray.500" fontWeight={500}>
                Estimated Gas
              </Text>
              <Text fontSize="sm" color="gray.300" fontWeight={600} fontFamily="mono">
                {gasEstimate.toString()}
              </Text>
            </Flex>
          )}

          {/* SEND BUTTON */}
          <Button
            size="lg"
            width="full"
            colorScheme="red"
            isLoading={isSending}
            loadingText="Broadcasting..."
            isDisabled={!isValidTarget || !calldata}
            onClick={handleSend}
            h="56px"
            borderRadius="14px"
            fontSize="md"
            fontWeight={700}
            letterSpacing="0.01em"
            bg="red.600"
            _hover={{
              bg: 'red.500',
              boxShadow: '0 0 40px rgba(220, 38, 38, 0.4), 0 4px 20px rgba(220, 38, 38, 0.3)',
              transform: 'translateY(-1px)',
            }}
            _active={{
              bg: 'red.700',
              transform: 'translateY(0)',
            }}
            boxShadow="0 0 20px rgba(220, 38, 38, 0.2)"
            transition="all 0.2s ease"
          >
            📡&nbsp;&nbsp;Broadcast Callout
          </Button>
          <Text fontSize="xs" color="gray.600" textAlign="center" mt={3}>
            This will write permanently to the blockchain. No undo.
          </Text>

          {/* Success state */}
          {lastTxHash && (
            <Box
              mt={5}
              p={4}
              bg="rgba(34, 197, 94, 0.06)"
              borderRadius="12px"
              border="1px solid rgba(34, 197, 94, 0.2)"
            >
              <Flex align="center" gap={2} mb={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
                <Text fontSize="xs" color="green.300" fontWeight={600} letterSpacing="0.04em" textTransform="uppercase">
                  Transmitted
                </Text>
              </Flex>
              <Code
                fontSize="xs"
                bg="transparent"
                color="green.400"
                fontFamily="mono"
                wordBreak="break-all"
              >
                {lastTxHash}
              </Code>
              <Box mt={3}>
                <Link
                  href={getExplorerTxUrl(chainId, lastTxHash)}
                  isExternal
                  color="green.300"
                  fontSize="sm"
                  fontWeight={600}
                  _hover={{ color: 'green.200' }}
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
