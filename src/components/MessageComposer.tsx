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
import { useAppKit } from '@reown/appkit/react'
import { useAccount, useEstimateGas, useSendTransaction, useChainId } from 'wagmi'
import { type Address, isAddress, parseEther } from 'viem'
import { keyframes } from '@emotion/react'
import {
  templateCategories,
  getTemplatesByCategory,
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
import { getExplorerTxUrl } from '../config/web3'
import { cardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'

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

export function MessageComposer() {
  const { open } = useAppKit()
  const { isConnected, address: walletAddress } = useAccount()
  const chainId = useChainId()
  const toast = useToast()

  // ── Address state ────────────────────────────────────────────────
  const [targetAddress, setTargetAddress] = useState('')

  // ── Template state ───────────────────────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState<TemplateCategoryId | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  // ── Encryption state ─────────────────────────────────────────────
  const [encryptEnabled, setEncryptEnabled] = useState(false)
  const [encryptPassphrase, setEncryptPassphrase] = useState('')

  // ── TX state ─────────────────────────────────────────────────────
  const [isSending, setIsSending] = useState(false)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)

  // ── Derived: templates for selected category ─────────────────────
  const categoryTemplates = useMemo(() => {
    if (!selectedCategoryId) return []
    return getTemplatesByCategory(selectedCategoryId)
  }, [selectedCategoryId])

  // Auto-inject wallet address into receive_address if user hasn't touched it
  useEffect(() => {
    if (
      selectedTemplate &&
      walletAddress &&
      selectedTemplate.variables.some((v) => v.key === 'receive_address') &&
      !variableValues['receive_address']
    ) {
      setVariableValues((prev) => ({ ...prev, receive_address: walletAddress }))
    }
  }, [selectedTemplate, walletAddress, variableValues])

  // ── Build the final message ──────────────────────────────────────
  const finalMessage = useMemo(() => {
    if (isCustomMode) return customMessage
    if (!selectedTemplate) return ''
    return applyTemplate(selectedTemplate, variableValues)
  }, [isCustomMode, customMessage, selectedTemplate, variableValues])

  // ── Validation: are all template variables filled? ───────────────
  const isTemplateFilled = useMemo(() => {
    if (isCustomMode) return customMessage.trim().length > 0
    if (!selectedTemplate) return false
    return allVariablesFilled(selectedTemplate, variableValues)
  }, [isCustomMode, customMessage, selectedTemplate, variableValues])

  // ── Encode to calldata ───────────────────────────────────────────
  const [calldata, setCalldata] = useState<`0x${string}` | undefined>(undefined)

  useEffect(() => {
    if (!finalMessage) {
      setCalldata(undefined)
      return
    }
    if (encryptEnabled && encryptPassphrase) {
      let cancelled = false
      encryptMessage(finalMessage, encryptPassphrase)
        .then((encrypted) => {
          if (!cancelled) setCalldata(encodeMessage(encrypted))
        })
        .catch(() => {
          // Encryption failed — clear calldata so stale data isn't sent
          if (!cancelled) setCalldata(undefined)
        })
      return () => { cancelled = true }
    } else {
      setCalldata(encodeMessage(finalMessage))
    }
  }, [finalMessage, encryptEnabled, encryptPassphrase])

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

  // ── Handlers ─────────────────────────────────────────────────────

  const handleCategorySelect = useCallback((categoryId: TemplateCategoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedTemplate(null)
    setVariableValues({})
    setIsCustomMode(false)
  }, [])

  const handleTemplateSelect = useCallback((template: MessageTemplate) => {
    setSelectedTemplate(template)
    // Pre-fill receive_address with connected wallet
    const initial: Record<string, string> = {}
    if (walletAddress) {
      for (const v of template.variables) {
        if (v.key === 'receive_address') {
          initial[v.key] = walletAddress
        }
      }
    }
    setVariableValues(initial)
    setIsCustomMode(false)
  }, [walletAddress])

  const handleCustomMode = useCallback(() => {
    setSelectedCategoryId(null)
    setSelectedTemplate(null)
    setVariableValues({})
    setIsCustomMode(true)
  }, [])

  const handleVariableChange = useCallback((key: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleBackToCategories = useCallback(() => {
    setSelectedCategoryId(null)
    setSelectedTemplate(null)
    setVariableValues({})
  }, [])

  const handleBackToTemplates = useCallback(() => {
    setSelectedTemplate(null)
    setVariableValues({})
  }, [])

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
        <Button
          size="lg"
          px={8}
          fontWeight="800"
          fontSize="sm"
          letterSpacing="0.06em"
          bg="rgba(220, 38, 38, 0.85)"
          color="white"
          border="1px solid"
          borderColor="rgba(220, 38, 38, 0.6)"
          borderRadius="xl"
          _hover={{
            bg: 'red.600',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)',
          }}
          _active={{ bg: 'red.700', transform: 'translateY(0)' }}
          transition="all 0.2s"
          onClick={() => open()}
        >
          Connect Wallet
        </Button>
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
        <SectionLabel icon="🎯" label="Target Address" accent="red.400" />
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none" h="full" pl={1}>
            <Text color="red.500" fontSize="xs" fontFamily="mono" fontWeight="700">0x</Text>
          </InputLeftElement>
          <Input
            placeholder="Paste scammer address..."
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            aria-label="Target wallet address"
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
        {targetAddress && !isValidTarget && (
          <Text fontSize="xs" color="orange.400" mt={2} fontWeight="600">⚠ Invalid address format</Text>
        )}
        {isValidTarget && (
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

                return (
                  <Box key={variable.key}>
                    <HStack mb={1.5} spacing={2}>
                      <Text fontSize="11px" fontWeight="700" letterSpacing="0.06em"
                        textTransform="uppercase" color="whiteAlpha.400">
                        {variable.label}
                      </Text>
                      {isFilled && !error && (
                        <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
                      )}
                      {error && (
                        <Text fontSize="10px" color="orange.400" fontWeight="600">{error}</Text>
                      )}
                    </HStack>
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

            {/* Live preview */}
            <Box
              bg="rgba(6, 6, 15, 0.7)"
              p={4} borderRadius="xl"
              border="1px solid" borderColor="whiteAlpha.50"
            >
              <Text fontSize="10px" color="whiteAlpha.300" fontWeight="700"
                letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                Live Preview
              </Text>
              <Text fontSize="sm" color="whiteAlpha.500" fontStyle="italic" lineHeight="1.7">
                &ldquo;{finalMessage}&rdquo;
              </Text>
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
        <FormControl display="flex" alignItems="center" mb={encryptEnabled ? 4 : 0}>
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
            label="Encrypt with a passphrase. Share it separately with the recipient."
            placement="top" bg="gray.800" color="gray.200"
            fontSize="xs" borderRadius="lg" px={3} py={2}
          >
            <Box>
              <Switch
                id="encrypt-toggle"
                colorScheme="red" size="md"
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
            type="password" fontSize="sm"
            bg="rgba(6, 6, 15, 0.9)"
            borderColor="whiteAlpha.100"
            borderRadius="xl" h="46px"
            _placeholder={{ color: 'whiteAlpha.200' }}
          />
        </Collapse>
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

          {/* Gas estimate */}
          {gasEstimate && (
            <HStack
              mb={4} p={3}
              bg="rgba(6, 6, 15, 0.5)" borderRadius="lg"
              border="1px solid" borderColor="whiteAlpha.50"
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
            size="lg" width="full" h="60px"
            fontSize="md" fontWeight="900"
            letterSpacing="0.1em" textTransform="uppercase"
            isLoading={isSending}
            loadingText="Broadcasting..."
            isDisabled={!isValidTarget || !calldata}
            onClick={handleSend}
            aria-label="Send message on-chain permanently"
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
            _active={{ transform: 'translateY(0)', bg: 'red.700' }}
            _disabled={{
              cursor: 'not-allowed', opacity: 1,
              _hover: { transform: 'none', boxShadow: 'none', bg: 'rgba(220, 38, 38, 0.15)' },
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
