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
  useToast,
  Code,
  Link,
  Collapse,
  SimpleGrid,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { ComposerConnectButton } from './WalletButton'
import { useAccount, useBalance, useEstimateGas, useSendTransaction, useSignMessage, useChainId, useSwitchChain } from 'wagmi'
import { type Address, isAddress, parseEther, formatUnits } from 'viem'
import { keyframes } from '@emotion/react'
import {
  templateCategories,
  getTemplatesByCategory,
  messageTemplates,
  type TemplateCategoryId,
  type MessageTemplate,
} from '../config/templates'
import {
  applyTemplate,
  allVariablesFilled,
  validateVariable,
  getVariableProgress,
} from '../utils/templateEngine'
import { encodeMessage } from '../utils/encoding'
import { encryptMessage } from '../utils/encryption'
import { EncryptionControls } from './EncryptionControls'
import { getExplorerTxUrl, networks } from '../config/web3'
import { cardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'
import { parseTheftTransaction, type ParsedTransaction } from '../services/transactionParser'
import { classifyError, logErrorContext, withRetry, validatePublicKey } from '../utils/errorHandling'

const targetGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.3), 0 0 20px rgba(220, 38, 38, 0.06); }
  50% { box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.5), 0 0 40px rgba(220, 38, 38, 0.12); }
`

// Color config for category cards + template cards
const categoryColors: Record<string, {
  bg: string; bgHover: string; border: string; glow: string
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
  orange: {
    bg: 'rgba(237, 137, 54, 0.06)',
    bgHover: 'rgba(237, 137, 54, 0.1)',
    border: 'rgba(237, 137, 54, 0.35)',
    glow: '0 0 30px rgba(237, 137, 54, 0.12), 0 0 60px rgba(237, 137, 54, 0.05)',
    text: 'orange.300',
    badge: 'orange',
    iconBg: 'rgba(237, 137, 54, 0.12)',
  },
  purple: {
    bg: 'rgba(159, 122, 234, 0.06)',
    bgHover: 'rgba(159, 122, 234, 0.1)',
    border: 'rgba(159, 122, 234, 0.35)',
    glow: '0 0 30px rgba(159, 122, 234, 0.12), 0 0 60px rgba(159, 122, 234, 0.05)',
    text: 'purple.300',
    badge: 'purple',
    iconBg: 'rgba(159, 122, 234, 0.12)',
  },
}

const STORAGE_KEY = 'callout-composer-state'

export function MessageComposer() {
  const { isConnected, address: walletAddress } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const toast = useToast()
  
  // Native token balance
  const { data: balance } = useBalance({
    address: walletAddress,
  })

  // Track whether user manually cleared receive_address to prevent auto-inject
  const receiveAddressManuallyCleared = useRef(false)

  // ── Load saved state from localStorage ──────────────────────────
  const loadSavedState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null
      return JSON.parse(saved)
    } catch {
      return null
    }
  }, [])

  // ── Address state ────────────────────────────────────────────────
  const [targetAddress, setTargetAddress] = useState(() => loadSavedState()?.targetAddress || '')

  // ── Template state ───────────────────────────────────────────────
  const savedState = loadSavedState()
  const [selectedCategoryId, setSelectedCategoryId] = useState<TemplateCategoryId | null>(
    savedState?.selectedCategoryId || null
  )
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(() => {
    if (savedState?.selectedTemplateId) {
      return messageTemplates.find(t => t.id === savedState.selectedTemplateId) || null
    }
    return null
  })
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    savedState?.variableValues || {}
  )
  const [isCustomMode, setIsCustomMode] = useState(savedState?.isCustomMode || false)
  const [customMessage, setCustomMessage] = useState(savedState?.customMessage || '')
  
  // ── Message editing state ────────────────────────────────────────
  const [isEditingMessage, setIsEditingMessage] = useState(false)
  const [editedMessage, setEditedMessage] = useState('')

  // ── Encryption state ─────────────────────────────────────────────
  const [encryptEnabled, setEncryptEnabled] = useState(savedState?.encryptEnabled || false)
  const [encryptPublicKey, setEncryptPublicKey] = useState('')

  // ── TX state ─────────────────────────────────────────────────────
  const [isSending, setIsSending] = useState(false)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  
  // ── Signature mode state ─────────────────────────────────────────
  const [signMode, setSignMode] = useState(false) // true = sign only, false = send tx
  const [lastSignature, setLastSignature] = useState<string | null>(null)
  
  // ── Transaction parsing state ────────────────────────────────────
  const [txHashInput, setTxHashInput] = useState('')
  const [parsedTx, setParsedTx] = useState<ParsedTransaction | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  // ── Derived: templates for selected category ─────────────────────
  const categoryTemplates = useMemo(() => {
    if (!selectedCategoryId) return []
    return getTemplatesByCategory(selectedCategoryId)
  }, [selectedCategoryId])

  // ── Save state to localStorage ──────────────────────────────────
  useEffect(() => {
    try {
      const stateToSave = {
        targetAddress,
        selectedCategoryId,
        selectedTemplateId: selectedTemplate?.id,
        variableValues,
        isCustomMode,
        customMessage,
        encryptEnabled,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch {
      // Ignore localStorage errors
    }
  }, [targetAddress, selectedCategoryId, selectedTemplate, variableValues, isCustomMode, customMessage, encryptEnabled])

  // Auto-inject wallet address into receive_address ONLY if user hasn't manually cleared it
  useEffect(() => {
    if (
      selectedTemplate &&
      walletAddress &&
      selectedTemplate.variables.some((v) => v.key === 'receive_address') &&
      !variableValues['receive_address'] &&
      !receiveAddressManuallyCleared.current
    ) {
      setVariableValues((prev) => ({ ...prev, receive_address: walletAddress }))
    }
  }, [selectedTemplate, walletAddress]) // Removed variableValues from deps to prevent loop

  // ── Build the final message ──────────────────────────────────────
  const finalMessage = useMemo(() => {
    if (isEditingMessage) return editedMessage
    if (isCustomMode) return customMessage
    if (!selectedTemplate) return ''
    return applyTemplate(selectedTemplate, variableValues)
  }, [isEditingMessage, editedMessage, isCustomMode, customMessage, selectedTemplate, variableValues])

  // ── Validation: are all template variables filled? ───────────────
  const isTemplateFilled = useMemo(() => {
    if (isCustomMode) return customMessage.trim().length > 0
    if (isEditingMessage) return editedMessage.trim().length > 0
    if (!selectedTemplate) return false
    return allVariablesFilled(selectedTemplate, variableValues)
  }, [isCustomMode, customMessage, isEditingMessage, editedMessage, selectedTemplate, variableValues])

  // ── Encode to calldata ───────────────────────────────────────────
  const [calldata, setCalldata] = useState<`0x${string}` | undefined>(undefined)

  useEffect(() => {
    if (!finalMessage) {
      setCalldata(undefined)
      return
    }
    
    // Encrypt with ECIES if enabled and public key provided
    if (encryptEnabled && encryptPublicKey) {
      // Validate public key before attempting encryption
      const validation = validatePublicKey(encryptPublicKey)
      if (!validation.isValid) {
        toast({
          title: '⚠️ Invalid Public Key',
          description: validation.suggestion || validation.error,
          status: 'warning',
          duration: 6000,
          isClosable: true,
        })
        setCalldata(undefined)
        return
      }

      let cancelled = false
      encryptMessage(finalMessage, encryptPublicKey)
        .then((encryptedHex) => {
          // Raw ECIES output already in hex, just add 0x prefix
          if (!cancelled) setCalldata(`0x${encryptedHex}` as `0x${string}`)
        })
        .catch((err) => {
          // Encryption failed — clear calldata so stale data isn't sent
          if (!cancelled) {
            setCalldata(undefined)
            const errorContext = classifyError(err, { component: 'MessageComposer.encryption' })
            logErrorContext(errorContext, 'MessageComposer.encryptMessage')
            
            toast({
              title: '⚠️ Encryption Failed',
              description: errorContext.actionableSteps.join(' • '),
              status: 'error',
              duration: 6000,
              isClosable: true,
            })
          }
        })
      return () => { cancelled = true }
    } else {
      // No encryption - encode as UTF-8 hex
      setCalldata(encodeMessage(finalMessage))
    }
  }, [finalMessage, encryptEnabled, encryptPublicKey, toast])

  const isValidTarget = targetAddress ? isAddress(targetAddress) : false

  // ── Gas estimation ───────────────────────────────────────────────
  const { data: gasEstimate } = useEstimateGas(
    isValidTarget && calldata
      ? {
          to: targetAddress as Address,
          data: calldata,
          value: parseEther('0'),
        }
      : undefined,
  )

  // ── Send transaction ─────────────────────────────────────────────
  const { sendTransactionAsync } = useSendTransaction()

  const handleSend = useCallback(async () => {
    if (!isValidTarget || !calldata) return

    setIsSending(true)
    try {
      // Wrap transaction in retry logic for transient errors
      const hash = await withRetry(
        async () => {
          return await sendTransactionAsync({
            to: targetAddress as Address,
            data: calldata,
            value: parseEther('0'),
          })
        },
        {
          maxAttempts: 2, // Only retry once for wallet operations
          delayMs: 1000,
          shouldRetry: (errCtx) => {
            // Only retry network errors, not user rejections
            return errCtx.isRetryable && errCtx.category === 'NETWORK'
          },
        }
      )
      
      setLastTxHash(hash)
      toast({
        title: '✓ Message Sent On-Chain',
        description: `Tx: ${hash.slice(0, 14)}...`,
        status: 'success',
        duration: 10000,
        isClosable: true,
      })
    } catch (err: unknown) {
      const errorContext = classifyError(err, {
        component: 'MessageComposer',
        targetAddress,
        chainId,
      })
      
      logErrorContext(errorContext, 'MessageComposer.handleSend')
      
      // Show user-friendly error with actionable steps
      toast({
        title: `⚠️ ${errorContext.userMessage}`,
        description: errorContext.actionableSteps.join(' • '),
        status: 'error',
        duration: 8000,
        isClosable: true,
      })
    } finally {
      setIsSending(false)
    }
  }, [isValidTarget, calldata, targetAddress, chainId, sendTransactionAsync, toast])

  // ── Sign message (proof of ownership without sending) ────────────
  const { signMessageAsync } = useSignMessage()

  const handleSign = useCallback(async () => {
    if (!finalMessage.trim()) {
      toast({
        title: 'No message to sign',
        description: 'Please enter a message first.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSending(true)
    setLastSignature(null)
    setLastTxHash(null)

    try {
      const signature = await signMessageAsync({ message: finalMessage })
      setLastSignature(signature)

      toast({
        title: 'Message Signed ✓',
        description: 'Copy the message + signature to prove ownership.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (err: any) {
      console.error('Sign error:', err)
      toast({
        title: 'Signing Failed',
        description: err.message || 'User rejected signature request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSending(false)
    }
  }, [finalMessage, signMessageAsync, toast])

  // ── Handlers ─────────────────────────────────────────────────────

  const handleCategorySelect = useCallback((categoryId: TemplateCategoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedTemplate(null)
    setVariableValues({})
    setIsCustomMode(false)
    setIsEditingMessage(false)
    receiveAddressManuallyCleared.current = false
  }, [])

  const handleTemplateSelect = useCallback((template: MessageTemplate) => {
    setSelectedTemplate(template)
    // Pre-fill receive_address with connected wallet
    const initial: Record<string, string> = {}
    if (walletAddress && !receiveAddressManuallyCleared.current) {
      for (const v of template.variables) {
        if (v.key === 'receive_address') {
          initial[v.key] = walletAddress
        }
      }
    }
    setVariableValues(initial)
    setIsCustomMode(false)
    setIsEditingMessage(false)
  }, [walletAddress])

  const handleCustomMode = useCallback(() => {
    setSelectedCategoryId(null)
    setSelectedTemplate(null)
    setVariableValues({})
    setIsCustomMode(true)
    setIsEditingMessage(false)
    receiveAddressManuallyCleared.current = false
  }, [])

  const handleVariableChange = useCallback((key: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }))
    // Track if user manually cleared receive_address
    if (key === 'receive_address' && !value) {
      receiveAddressManuallyCleared.current = true
    }
  }, [])

  const handleBackToCategories = useCallback(() => {
    setSelectedCategoryId(null)
    setSelectedTemplate(null)
    setVariableValues({})
    setIsEditingMessage(false)
    receiveAddressManuallyCleared.current = false
  }, [])

  const handleBackToTemplates = useCallback(() => {
    setSelectedTemplate(null)
    setVariableValues({})
    setIsEditingMessage(false)
    receiveAddressManuallyCleared.current = false
  }, [])

  const handleEditMessage = useCallback(() => {
    setEditedMessage(finalMessage)
    setIsEditingMessage(true)
  }, [finalMessage])

  const handleSaveEdit = useCallback(() => {
    setIsEditingMessage(false)
  }, [])

  // ── Parse transaction hash ───────────────────────────────────────
  const handleParseTx = useCallback(async () => {
    const hashToParse = txHashInput.trim() || targetAddress.trim()
    if (!hashToParse) {
      toast({
        title: 'Enter transaction hash',
        description: 'Paste the theft transaction hash to analyze',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setIsParsing(true)
    setParsedTx(null)

    try {
      const parsed = await parseTheftTransaction(hashToParse, chainId)
      setParsedTx(parsed)

      // Auto-populate fields
      if (parsed.scammer) {
        setTargetAddress(parsed.scammer)
      }

      // Auto-populate template variables if applicable
      if (selectedTemplate) {
        const updated: Record<string, string> = { ...variableValues }
        
        if (parsed.victim) {
          updated.exploited_address = parsed.victim
        }
        if (parsed.scammer && selectedTemplate.variables.some(v => v.key === 'spammer_address')) {
          updated.spammer_address = parsed.scammer
        }
        if (parsed.txHash) {
          updated.tx_hash = parsed.txHash
        }
        // Extract largest transfer for amount/token
        if (parsed.transfers.length > 0) {
          const largestTransfer = parsed.transfers.reduce((max, t) => 
            BigInt(t.value) > BigInt(max.value) ? t : max
          )
          if (largestTransfer.token) {
            updated.token_name = largestTransfer.token.symbol
            updated.amount = largestTransfer.value
          }
        }

        setVariableValues(updated)
      }

      toast({
        title: 'Transaction Parsed ✓',
        description: `Identified ${parsed.transfers.length} transfers. Victim: ${parsed.victim?.slice(0, 10)}..., Scammer: ${parsed.scammer?.slice(0, 10)}...`,
        status: 'success',
        duration: 5000,
      })
    } catch (err: any) {
      console.error('Parse error:', err)
      toast({
        title: 'Parse Failed',
        description: err.message || 'Could not parse transaction. Check the hash and network.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsParsing(false)
    }
  }, [txHashInput, targetAddress, chainId, selectedTemplate, variableValues, toast])

  // Get current network info
  const currentNetwork = networks.find(n => n.id === chainId)

  // ── Render: not connected ────────────────────────────────────────
  const _isDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
  if (!isConnected && !_isDemo) {
    return (
      <Box textAlign="center" py={{ base: 14, md: 20 }} px={6} {...cardStyle}>
        <Box
          w="56px" h="56px" borderRadius="xl"
          bg="rgba(220, 38, 38, 0.06)"
          border="1px solid" borderColor="rgba(220, 38, 38, 0.12)"
          display="flex" alignItems="center" justifyContent="center"
          mx="auto" mb={5}
        >
          <Text fontSize="xl">🔌</Text>
        </Box>
        <Text fontSize="md" fontWeight="700" color="whiteAlpha.600" mb={2}>
          Wallet Required
        </Text>
        <Text fontSize="sm" color="whiteAlpha.300" mb={6} maxW="280px" mx="auto" lineHeight="1.6">
          Connect your wallet to start sending on-chain messages
        </Text>
        <ComposerConnectButton />
      </Box>
    )
  }

  // ── Determine active color scheme ────────────────────────────────
  const activeCategory = selectedCategoryId
    ? templateCategories.find((c) => c.id === selectedCategoryId)
    : null
  const activeColors = activeCategory
    ? categoryColors[activeCategory.color] || categoryColors.red
    : null

  return (
    <VStack spacing={4} align="stretch">
      {/* ── Network Selector ── */}
      {isConnected && (
        <Box {...cardStyle} py={3}>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Text fontSize="xs" color="whiteAlpha.400" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase">
                Network
              </Text>
              <Badge
                colorScheme="blue"
                variant="solid"
                fontSize="10px"
                fontWeight="700"
                borderRadius="md"
                px={2}
              >
                {currentNetwork?.name || `Chain ${chainId}`}
              </Badge>
            </HStack>
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="ghost"
                fontSize="xs"
                color="whiteAlpha.500"
                _hover={{ color: 'whiteAlpha.700', bg: 'whiteAlpha.50' }}
              >
                Switch Network →
              </MenuButton>
              <MenuList bg="gray.900" borderColor="whiteAlpha.200">
                {networks.map((network) => (
                  <MenuItem
                    key={network.id}
                    onClick={() => switchChain?.({ chainId: Number(network.id) })}
                    bg="gray.900"
                    _hover={{ bg: 'whiteAlpha.100' }}
                    fontSize="sm"
                    isDisabled={network.id === chainId}
                  >
                    {network.name} {network.id === chainId && '✓'}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </HStack>
        </Box>
      )}

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
          top: 0, left: 0, right: 0, height: '2px',
          bgGradient: 'linear(to-r, transparent, rgba(220,38,38,0.6), transparent)',
        }}
      >
        <SectionLabel icon="🎯" label="Target Address or Transaction Hash" accent="red.400" />
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none" h="full" pl={1}>
            <Text color="red.500" fontSize="xs" fontFamily="mono" fontWeight="700">0x</Text>
          </InputLeftElement>
          <Input
            placeholder="Paste address or transaction hash..."
            value={targetAddress}
            onChange={(e) => {
              setTargetAddress(e.target.value)
              // Clear parsed data when user changes input
              if (parsedTx) setParsedTx(null)
            }}
            aria-label="Target wallet address or transaction hash"
            fontFamily="mono" fontSize="sm"
            bg="rgba(6, 6, 15, 0.9)" pl="42px" h="54px"
            borderColor={targetAddress ? (isValidTarget ? 'rgba(220, 38, 38, 0.4)' : 'orange.500') : 'whiteAlpha.100'}
            borderRadius="xl" borderWidth="1.5px"
            _hover={{ borderColor: 'rgba(220, 38, 38, 0.3)' }}
            _focus={{
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.4), 0 0 30px rgba(220, 38, 38, 0.1)',
            }}
            _placeholder={{ color: 'whiteAlpha.200' }}
          />
        </InputGroup>

        {/* Smart detection and parsing */}
        {targetAddress && targetAddress.length === 66 && !parsedTx && (
          <VStack align="stretch" spacing={2} mt={3}>
            <HStack spacing={2}>
              <Text fontSize="xs" color="purple.400" fontWeight="600">
                🔍 Transaction hash detected
              </Text>
            </HStack>
            <Button
              size="sm"
              colorScheme="purple"
              onClick={() => {
                setTxHashInput(targetAddress)
                handleParseTx()
              }}
              isLoading={isParsing}
              loadingText="Analyzing..."
            >
              Parse Transaction & Auto-Fill
            </Button>
          </VStack>
        )}

        {/* Parsed result */}
        {parsedTx && (
          <Box mt={3} p={3} bg="rgba(138, 75, 255, 0.06)" borderRadius="lg" border="1px solid" borderColor="rgba(138, 75, 255, 0.2)">
            <VStack align="stretch" spacing={2}>
              <HStack>
                <Text fontSize="xs" fontWeight="700" color="purple.300">
                  ✓ Transaction Parsed
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="whiteAlpha.400">Victim:</Text>
                <Code fontSize="xs" color="purple.300">{parsedTx.victim?.slice(0, 20)}...</Code>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="whiteAlpha.400">Scammer:</Text>
                <Code fontSize="xs" color="purple.300">{parsedTx.scammer?.slice(0, 20)}...</Code>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="xs" color="whiteAlpha.400">Transfers:</Text>
                <Text fontSize="xs" color="purple.300" fontWeight="600">{parsedTx.transfers.length}</Text>
              </HStack>
              <Text fontSize="xs" color="green.400" fontWeight="600" pt={1}>
                → Target set to scammer, template fields auto-filled
              </Text>
            </VStack>
          </Box>
        )}

        {targetAddress && !isValidTarget && targetAddress.length !== 66 && (
          <Text fontSize="xs" color="orange.400" mt={2} fontWeight="600">⚠ Invalid address format</Text>
        )}
        {isValidTarget && !parsedTx && (
          <HStack mt={2} spacing={1.5}>
            <Box w="6px" h="6px" borderRadius="full" bg="red.400" />
            <Text fontSize="xs" color="red.400" fontWeight="700" letterSpacing="0.03em">Target locked</Text>
          </HStack>
        )}
      </Box>

      {/* ── Message Template Section ── */}
      <Box {...cardStyle}>
        <SectionLabel icon="✉" label="Compose Message" />

        {/* ── STEP 1: Category selector (shown when no category selected & not custom) ── */}
        {!selectedCategoryId && !isCustomMode && (
          <>
            <Text fontSize="xs" color="whiteAlpha.300" mb={4} lineHeight="1.5">
              Choose a category for your on-chain message, or write a custom one.
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mb={4}>
              {templateCategories.map((cat) => {
                const colors = categoryColors[cat.color] || categoryColors.red
                return (
                  <Box
                    key={cat.id}
                    p={4} borderRadius="xl"
                    bg="rgba(6, 6, 15, 0.5)"
                    border="2px solid" borderColor="whiteAlpha.50"
                    cursor="pointer" transition="all 0.25s ease"
                    textAlign="center"
                    _hover={{
                      borderColor: colors.border,
                      bg: colors.bgHover,
                      transform: 'translateY(-2px)',
                      boxShadow: colors.glow,
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    onClick={() => handleCategorySelect(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleCategorySelect(cat.id)
                      }
                    }}
                    role="button" tabIndex={0}
                    aria-label={`${cat.name}: ${cat.description}`}
                  >
                    <Box
                      w="48px" h="48px" borderRadius="xl"
                      bg={colors.iconBg}
                      display="flex" alignItems="center" justifyContent="center"
                      mx="auto" mb={3}
                    >
                      <Text fontSize="xl">{cat.emoji}</Text>
                    </Box>
                    <Badge
                      colorScheme={colors.badge} variant="solid"
                      fontSize="10px" fontWeight="800"
                      letterSpacing="0.08em" borderRadius="md"
                      px={3} py={0.5} mb={2}
                    >
                      {cat.name}
                    </Badge>
                    <Text fontSize="11px" color="whiteAlpha.300" lineHeight="1.4" mt={1}>
                      {cat.description}
                    </Text>
                  </Box>
                )
              })}
            </SimpleGrid>

            {/* Custom message option */}
            <Box
              p={4} borderRadius="xl"
              bg="rgba(6, 6, 15, 0.5)"
              border="1px dashed" borderColor="whiteAlpha.100"
              cursor="pointer" transition="all 0.2s ease"
              _hover={{
                borderColor: 'rgba(159, 122, 234, 0.3)',
                bg: 'rgba(159, 122, 234, 0.07)',
              }}
              onClick={handleCustomMode}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCustomMode()
                }
              }}
              role="button" tabIndex={0}
              aria-label="Write a custom message"
            >
              <HStack spacing={2} justify="center">
                <Text fontSize="lg">✍️</Text>
                <Badge
                  colorScheme="purple" variant="solid"
                  fontSize="10px" fontWeight="800"
                  letterSpacing="0.05em" borderRadius="md"
                  px={2.5} py={0.5}
                >
                  Custom
                </Badge>
                <Text fontSize="xs" color="whiteAlpha.300" fontWeight="500">
                  Write your own message
                </Text>
              </HStack>
            </Box>
          </>
        )}

        {/* ── STEP 2: Template picker (shown when category selected but no template) ── */}
        {selectedCategoryId && !selectedTemplate && !isCustomMode && (
          <>
            <HStack mb={4} spacing={2}>
              <Box
                as="button"
                fontSize="xs" color="whiteAlpha.400"
                fontWeight="700" letterSpacing="0.05em"
                cursor="pointer" transition="color 0.15s"
                _hover={{ color: 'whiteAlpha.700' }}
                onClick={handleBackToCategories}
              >
                ← Categories
              </Box>
              {activeCategory && (
                <>
                  <Text fontSize="xs" color="whiteAlpha.200">/</Text>
                  <Badge
                    colorScheme={activeColors?.badge || 'gray'}
                    variant="subtle" fontSize="10px"
                    borderRadius="md" px={2}
                  >
                    {activeCategory.emoji} {activeCategory.name}
                  </Badge>
                </>
              )}
            </HStack>

            <Text fontSize="xs" color="whiteAlpha.300" mb={4} lineHeight="1.5">
              Select a template to customize:
            </Text>

            <VStack spacing={3} align="stretch">
              {categoryTemplates.map((tpl) => {
                const colors = activeColors || categoryColors.red
                return (
                  <Box
                    key={tpl.id}
                    p={4} borderRadius="xl"
                    bg="rgba(6, 6, 15, 0.5)"
                    border="1.5px solid" borderColor="whiteAlpha.50"
                    cursor="pointer" transition="all 0.2s ease"
                    _hover={{
                      borderColor: colors.border,
                      bg: colors.bgHover,
                      transform: 'translateX(4px)',
                    }}
                    onClick={() => handleTemplateSelect(tpl)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleTemplateSelect(tpl)
                      }
                    }}
                    role="button" tabIndex={0}
                    aria-label={`Select template: ${tpl.name}`}
                  >
                    <HStack spacing={3} align="flex-start">
                      <Text fontSize="lg" mt={0.5}>{tpl.emoji}</Text>
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="700" color="whiteAlpha.700" mb={1}>
                          {tpl.name}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.300" lineHeight="1.5">
                          {tpl.description}
                        </Text>
                        <HStack mt={2} spacing={1} flexWrap="wrap">
                          {tpl.variables.map((v) => (
                            <Badge
                              key={v.key}
                              variant="outline"
                              colorScheme="whiteAlpha"
                              fontSize="9px"
                              borderRadius="md"
                              px={1.5}
                              opacity={0.5}
                            >
                              {v.label}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                      <Text fontSize="xs" color="whiteAlpha.200" mt={1}>→</Text>
                    </HStack>
                  </Box>
                )
              })}
            </VStack>
          </>
        )}

        {/* ── STEP 3: Variable form + live preview (template selected) ── */}
        {selectedTemplate && !isCustomMode && (
          <>
            {/* Breadcrumb */}
            <HStack mb={4} spacing={2}>
              <Box
                as="button"
                fontSize="xs" color="whiteAlpha.400"
                fontWeight="700" letterSpacing="0.05em"
                cursor="pointer" transition="color 0.15s"
                _hover={{ color: 'whiteAlpha.700' }}
                onClick={handleBackToCategories}
              >
                ← Categories
              </Box>
              {activeCategory && (
                <>
                  <Text fontSize="xs" color="whiteAlpha.200">/</Text>
                  <Box
                    as="button"
                    fontSize="xs" color="whiteAlpha.400"
                    fontWeight="700" cursor="pointer"
                    transition="color 0.15s"
                    _hover={{ color: 'whiteAlpha.700' }}
                    onClick={handleBackToTemplates}
                  >
                    {activeCategory.emoji} {activeCategory.name}
                  </Box>
                </>
              )}
              <Text fontSize="xs" color="whiteAlpha.200">/</Text>
              <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600">
                {selectedTemplate.emoji} {selectedTemplate.name}
              </Text>
            </HStack>

            {/* Variable form fields */}
            <VStack spacing={3} align="stretch" mb={4}>
              {selectedTemplate.variables.map((variable) => {
                const value = variableValues[variable.key] || ''
                const error = value ? validateVariable(variable, value) : null
                const isFilled = value.trim().length > 0
                const isAddr = variable.type === 'address'
                const isDeadline = variable.key === 'deadline'

                return (
                  <Box key={variable.key}>
                    <HStack mb={1.5} spacing={2}>
                      <Text fontSize="11px" fontWeight="700" letterSpacing="0.06em"
                        textTransform="uppercase" color="whiteAlpha.400">
                        {variable.label}
                        {variable.optional && (
                          <Text as="span" fontSize="10px" ml={1} color="whiteAlpha.250" fontWeight="500">
                            (optional)
                          </Text>
                        )}
                      </Text>
                      {isFilled && !error && (
                        <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
                      )}
                      {error && (
                        <Text fontSize="10px" color="orange.400" fontWeight="600">{error}</Text>
                      )}
                    </HStack>
                    {isDeadline ? (
                      <Input
                        type="datetime-local"
                        value={value}
                        onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                        aria-label={variable.label}
                        fontSize="sm"
                        bg="rgba(6, 6, 15, 0.9)"
                        h="46px"
                        borderColor={error ? 'orange.500' : isFilled ? (activeColors?.border || 'whiteAlpha.200') : 'whiteAlpha.100'}
                        borderRadius="xl"
                        _hover={{ borderColor: 'whiteAlpha.200' }}
                        _focus={{
                          borderColor: activeColors?.text || 'whiteAlpha.400',
                          boxShadow: activeColors
                            ? `0 0 0 1px ${activeColors.border}`
                            : 'none',
                        }}
                        sx={{
                          colorScheme: 'dark',
                          '::-webkit-calendar-picker-indicator': {
                            filter: 'invert(1)',
                            cursor: 'pointer',
                          }
                        }}
                      />
                    ) : (
                      <Input
                        placeholder={variable.placeholder}
                        value={value}
                        onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                        aria-label={variable.label}
                        fontFamily={isAddr ? 'mono' : 'body'}
                        fontSize="sm"
                        bg="rgba(6, 6, 15, 0.9)"
                        h="46px"
                        borderColor={error ? 'orange.500' : isFilled ? (activeColors?.border || 'whiteAlpha.200') : 'whiteAlpha.100'}
                        borderRadius="xl"
                        _hover={{ borderColor: 'whiteAlpha.200' }}
                        _focus={{
                          borderColor: activeColors?.text || 'whiteAlpha.400',
                          boxShadow: activeColors
                            ? `0 0 0 1px ${activeColors.border}`
                            : 'none',
                        }}
                        _placeholder={{ color: 'whiteAlpha.200' }}
                      />
                    )}
                  </Box>
                )
              })}
            </VStack>

            {/* Progress indicator */}
            {selectedTemplate.variables.length > 0 && (() => {
              const { filled, total } = getVariableProgress(selectedTemplate, variableValues)
              return (
                <HStack mb={3} spacing={2}>
                  <Box flex={1} h="3px" borderRadius="full" bg="whiteAlpha.100" overflow="hidden">
                    <Box
                      h="full" borderRadius="full"
                      bg={filled === total ? 'green.400' : (activeColors?.text || 'whiteAlpha.300')}
                      w={`${(filled / total) * 100}%`}
                      transition="width 0.3s ease"
                    />
                  </Box>
                  <Text fontSize="10px" color="whiteAlpha.300" fontWeight="600">
                    {filled}/{total}
                  </Text>
                </HStack>
              )
            })()}

            {/* Live preview / editable */}
            <Box
              bg="rgba(6, 6, 15, 0.7)"
              p={4} borderRadius="xl"
              border="1px solid" borderColor="whiteAlpha.50"
            >
              <HStack mb={2} justify="space-between">
                <Text fontSize="10px" color="whiteAlpha.300" fontWeight="700"
                  letterSpacing="0.08em" textTransform="uppercase">
                  {isEditingMessage ? 'Editing Message' : 'Live Preview'}
                </Text>
                {!isEditingMessage && isTemplateFilled && (
                  <IconButton
                    aria-label="Edit message"
                    icon={<Text fontSize="xs">✏️</Text>}
                    size="xs"
                    variant="ghost"
                    color="whiteAlpha.400"
                    _hover={{ color: 'whiteAlpha.700', bg: 'whiteAlpha.50' }}
                    onClick={handleEditMessage}
                  />
                )}
                {isEditingMessage && (
                  <Button
                    size="xs"
                    variant="ghost"
                    fontSize="xs"
                    color="green.400"
                    _hover={{ color: 'green.300', bg: 'whiteAlpha.50' }}
                    onClick={handleSaveEdit}
                  >
                    ✓ Done
                  </Button>
                )}
              </HStack>
              {isEditingMessage ? (
                <Textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  fontSize="sm"
                  color="whiteAlpha.600"
                  lineHeight="1.7"
                  rows={6}
                  bg="rgba(6, 6, 15, 0.9)"
                  borderColor="whiteAlpha.100"
                  borderRadius="lg"
                  _focus={{ borderColor: 'whiteAlpha.300' }}
                />
              ) : (
                <Text fontSize="sm" color="whiteAlpha.500" fontStyle="italic" lineHeight="1.7">
                  &ldquo;{finalMessage}&rdquo;
                </Text>
              )}
            </Box>
          </>
        )}

        {/* ── Custom message mode ── */}
        {isCustomMode && (
          <>
            <HStack mb={4} spacing={2}>
              <Box
                as="button"
                fontSize="xs" color="whiteAlpha.400"
                fontWeight="700" letterSpacing="0.05em"
                cursor="pointer" transition="color 0.15s"
                _hover={{ color: 'whiteAlpha.700' }}
                onClick={handleBackToCategories}
              >
                ← Categories
              </Box>
              <Text fontSize="xs" color="whiteAlpha.200">/</Text>
              <Badge
                colorScheme="purple" variant="subtle"
                fontSize="10px" borderRadius="md" px={2}
              >
                ✍️ Custom
              </Badge>
            </HStack>

            <Textarea
              placeholder="Type your message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              aria-label="Custom message text"
              bg="rgba(6, 6, 15, 0.9)"
              borderColor="whiteAlpha.100"
              borderRadius="xl"
              fontSize="sm"
              rows={5}
              _focus={{
                borderColor: 'purple.400',
                boxShadow: '0 0 0 1px rgba(159, 122, 234, 0.3)',
              }}
              _placeholder={{ color: 'whiteAlpha.200' }}
            />
          </>
        )}
      </Box>

      {/* ── Encryption ── */}
      <Box {...cardStyle}>
        <EncryptionControls
          enabled={encryptEnabled}
          onEnabledChange={setEncryptEnabled}
          publicKey={encryptPublicKey}
          onPublicKeyChange={setEncryptPublicKey}
        />
      </Box>

      {/* ── Preview & Send ── */}
      <Collapse in={!!finalMessage && isTemplateFilled} animateOpacity>
        <Box
          {...cardStyle}
          borderColor="rgba(220, 38, 38, 0.15)"
          position="relative" overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '2px',
            bgGradient: 'linear(to-r, transparent, rgba(220,38,38,0.5), transparent)',
          }}
        >
          <SectionLabel icon="📤" label="Ready to Send" accent="red.400" />

          {/* Message text */}
          <Box
            bg="rgba(6, 6, 15, 0.9)"
            p={4} borderRadius="xl"
            border="1px solid" borderColor="whiteAlpha.50"
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
                fontSize="10px" color="whiteAlpha.250" mb={1.5}
                fontWeight="700" letterSpacing="0.08em" textTransform="uppercase"
              >
                Calldata · {calldata.length} chars
              </Text>
              <Code
                display="block" whiteSpace="nowrap"
                overflow="hidden" textOverflow="ellipsis"
                p={3} borderRadius="lg" fontSize="xs"
                bg="rgba(6, 6, 15, 0.9)"
                border="1px solid" borderColor="whiteAlpha.50"
                color="whiteAlpha.300" fontFamily="mono"
              >
                {calldata}
              </Code>
            </Box>
          )}

          {/* Balance & Gas info */}
          {(balance || (!signMode && gasEstimate)) && (
            <VStack align="stretch" mb={4} spacing={2}>
              {/* Native token balance */}
              {balance && (
                <HStack
                  p={3}
                  bg="rgba(6, 6, 15, 0.5)" borderRadius="lg"
                  border="1px solid" borderColor="whiteAlpha.50"
                  spacing={2}
                  justify="space-between"
                >
                  <HStack spacing={2}>
                    <Text fontSize="xs" color="whiteAlpha.300">💰</Text>
                    <Text fontSize="xs" color="whiteAlpha.300">Your balance:</Text>
                  </HStack>
                  <Text fontSize="xs" color="whiteAlpha.700" fontFamily="mono" fontWeight="600">
                    {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} {balance.symbol}
                  </Text>
                </HStack>
              )}
              
              {/* Gas estimate (only when sending) */}
              {!signMode && gasEstimate && (
                <HStack
                  p={3}
                  bg="rgba(6, 6, 15, 0.5)" borderRadius="lg"
                  border="1px solid" borderColor="whiteAlpha.50"
                  spacing={2}
                  justify="space-between"
                >
                  <HStack spacing={2}>
                    <Text fontSize="xs" color="whiteAlpha.300">⛽</Text>
                    <Text fontSize="xs" color="whiteAlpha.300">Estimated gas:</Text>
                  </HStack>
                  <Text fontSize="xs" color="whiteAlpha.500" fontFamily="mono" fontWeight="600">
                    {gasEstimate.toString()}
                  </Text>
                </HStack>
              )}
            </VStack>
          )}

          {/* Sign mode toggle */}
          <Box
            mb={4} p={4}
            bg="rgba(6, 6, 15, 0.5)" borderRadius="xl"
            border="1px solid" borderColor="whiteAlpha.100"
          >
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1} flex={1}>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="700" color="whiteAlpha.900">
                    🔏 Sign Message (No Transaction)
                  </Text>
                </HStack>
                <Text fontSize="xs" color="whiteAlpha.400" lineHeight="1.5">
                  Prove ownership without sending. Useful if the address is compromised.
                </Text>
              </VStack>
              <Button
                size="sm"
                onClick={() => {
                  setSignMode(!signMode)
                  setLastSignature(null)
                  setLastTxHash(null)
                }}
                bg={signMode ? 'rgba(138, 75, 255, 0.15)' : 'rgba(6, 6, 15, 0.5)'}
                border="1px solid"
                borderColor={signMode ? 'rgba(138, 75, 255, 0.3)' : 'whiteAlpha.100'}
                color={signMode ? 'purple.300' : 'whiteAlpha.500'}
                _hover={{
                  bg: signMode ? 'rgba(138, 75, 255, 0.25)' : 'whiteAlpha.50',
                }}
              >
                {signMode ? 'Enabled' : 'Disabled'}
              </Button>
            </HStack>
          </Box>

          {/* Send or Sign button */}
          <Button
            size="lg" width="full" h="60px"
            fontSize="md" fontWeight="900"
            letterSpacing="0.1em" textTransform="uppercase"
            isLoading={isSending}
            loadingText={signMode ? 'Signing...' : 'Broadcasting...'}
            isDisabled={signMode ? !finalMessage.trim() : (!isValidTarget || !calldata)}
            onClick={signMode ? handleSign : handleSend}
            aria-label={signMode ? 'Sign message to prove ownership' : 'Send message on-chain permanently'}
            bg={
              (signMode ? !finalMessage.trim() : (!isValidTarget || !calldata))
                ? (signMode ? 'rgba(138, 75, 255, 0.15)' : 'rgba(220, 38, 38, 0.15)')
                : (signMode ? 'rgba(138, 75, 255, 0.9)' : 'rgba(220, 38, 38, 0.9)')
            }
            color={
              (signMode ? !finalMessage.trim() : (!isValidTarget || !calldata))
                ? (signMode ? 'rgba(138, 75, 255, 0.4)' : 'rgba(220, 38, 38, 0.4)')
                : 'white'
            }
            border="2px solid"
            borderColor={
              (signMode ? !finalMessage.trim() : (!isValidTarget || !calldata))
                ? (signMode ? 'rgba(138, 75, 255, 0.1)' : 'rgba(220, 38, 38, 0.1)')
                : (signMode ? 'rgba(138, 75, 255, 0.5)' : 'rgba(220, 38, 38, 0.5)')
            }
            borderRadius="xl"
            _hover={{
              bg: signMode ? 'purple.600' : 'red.600',
              transform: 'translateY(-2px)',
              boxShadow: signMode
                ? '0 8px 50px rgba(138, 75, 255, 0.4), 0 0 80px rgba(138, 75, 255, 0.15)'
                : '0 8px 50px rgba(220, 38, 38, 0.4), 0 0 80px rgba(220, 38, 38, 0.15)',
            }}
            _active={{ transform: 'translateY(0)', bg: signMode ? 'purple.700' : 'red.700' }}
            _disabled={{
              cursor: 'not-allowed', opacity: 1,
              _hover: {
                transform: 'none',
                boxShadow: 'none',
                bg: signMode ? 'rgba(138, 75, 255, 0.15)' : 'rgba(220, 38, 38, 0.15)',
              },
            }}
            transition="all 0.2s"
            boxShadow={
              (signMode ? !finalMessage.trim() : (!isValidTarget || !calldata))
                ? 'none'
                : (signMode
                  ? '0 4px 30px rgba(138, 75, 255, 0.3)'
                  : '0 4px 30px rgba(220, 38, 38, 0.3)')
            }
          >
            {signMode ? '🔏 Sign Message' : '⚠️ Send On-Chain — Permanent'}
          </Button>

          <Text fontSize="10px" color="whiteAlpha.200" textAlign="center" mt={3} lineHeight="1.5">
            {signMode
              ? 'Signature proves you control this address without sending a transaction.'
              : 'This is irreversible. Your message will be inscribed on the blockchain forever.'}
          </Text>

          {/* Signature result */}
          <Collapse in={!!lastSignature} animateOpacity>
            {lastSignature && (
              <Box
                mt={5} p={5}
                bg="rgba(138, 75, 255, 0.06)" borderRadius="xl"
                border="1px solid" borderColor="rgba(138, 75, 255, 0.2)"
              >
                <HStack mb={3}>
                  <Box
                    w="24px" h="24px" borderRadius="full"
                    bg="rgba(138, 75, 255, 0.15)"
                    display="flex" alignItems="center" justifyContent="center"
                  >
                    <Text fontSize="xs" color="purple.300">✓</Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="700" color="purple.300">
                    Message Signed Successfully
                  </Text>
                </HStack>

                <VStack align="stretch" spacing={3}>
                  {/* Message */}
                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.400" mb={1} fontWeight="600">
                      Message:
                    </Text>
                    <Code
                      fontSize="xs" bg="rgba(6, 6, 15, 0.5)"
                      color="purple.300" fontFamily="mono"
                      display="block" p={3} borderRadius="lg"
                      whiteSpace="pre-wrap" wordBreak="break-all"
                    >
                      {finalMessage}
                    </Code>
                  </Box>

                  {/* Signature */}
                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.400" mb={1} fontWeight="600">
                      Signature:
                    </Text>
                    <Code
                      fontSize="xs" bg="rgba(6, 6, 15, 0.5)"
                      color="purple.400" fontFamily="mono"
                      display="block" p={3} borderRadius="lg"
                      whiteSpace="pre-wrap" wordBreak="break-all"
                    >
                      {lastSignature}
                    </Code>
                  </Box>

                  {/* Signer address */}
                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.400" mb={1} fontWeight="600">
                      Signed by:
                    </Text>
                    <Code
                      fontSize="xs" bg="rgba(6, 6, 15, 0.5)"
                      color="purple.300" fontFamily="mono"
                      display="block" p={3} borderRadius="lg"
                      wordBreak="break-all"
                    >
                      {walletAddress}
                    </Code>
                  </Box>

                  <Text fontSize="xs" color="whiteAlpha.300" lineHeight="1.6" pt={2}>
                    💡 Copy this message + signature to prove you control {walletAddress}. Anyone can verify it using tools like Etherscan's signature verifier.
                  </Text>
                </VStack>
              </Box>
            )}
          </Collapse>

          {/* Transaction result */}
          <Collapse in={!!lastTxHash} animateOpacity>
            {lastTxHash && (
              <Box
                mt={5} p={5}
                bg="rgba(72, 187, 120, 0.06)" borderRadius="xl"
                border="1px solid" borderColor="rgba(72, 187, 120, 0.2)"
              >
                <HStack mb={3}>
                  <Box
                    w="24px" h="24px" borderRadius="full"
                    bg="rgba(72, 187, 120, 0.15)"
                    display="flex" alignItems="center" justifyContent="center"
                  >
                    <Text fontSize="xs" color="green.400">✓</Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="700" color="green.300">
                    Message Broadcast Successfully
                  </Text>
                </HStack>
                <Code
                  fontSize="xs" bg="rgba(6, 6, 15, 0.5)"
                  color="green.400" fontFamily="mono"
                  display="block" p={3} borderRadius="lg"
                  mb={3} wordBreak="break-all" whiteSpace="normal"
                  border="1px solid" borderColor="rgba(72, 187, 120, 0.1)"
                >
                  {lastTxHash}
                </Code>
                <Link
                  href={getExplorerTxUrl(chainId, lastTxHash)}
                  isExternal color="green.300" fontSize="xs"
                  fontWeight="700" letterSpacing="0.03em"
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
