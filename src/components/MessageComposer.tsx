import { Box, VStack, HStack, useToast, Button } from '@chakra-ui/react'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useAccount, useSendTransaction, useSignMessage, useChainId } from 'wagmi'
import { type Address, type Hex, isAddress, parseEther } from 'viem'
import { useAppKit } from '@reown/appkit/react'
import {
  messageTemplates,
  templateCategories,
  type TemplateCategoryId,
  type MessageTemplate,
} from '../config/templates'
import { applyTemplate } from '../utils/templateEngine'
import { encodeMessage } from '../utils/encoding'
import { encryptMessage } from '../utils/encryption'
import { EncryptionControls } from './EncryptionControls'
import { useCardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'
import { useThemeTextColor, useAccentBorderColor, useAccentTextColor, useAccentBgColor } from '../shared/useThemeColors'
import { type ParsedTransaction } from '../services/transactionParser'
import { classifyError, logErrorContext, withRetry, validatePublicKey } from '../utils/errorHandling'
import { TemplateSelector } from './TemplateSelector'
import { NetworkSelector } from './composer/NetworkSelector'
import { TargetAddressInput } from './composer/TargetAddressInput'
import { VariableForm } from './composer/VariableForm'
import { MessageStatePreview } from './composer/MessageStatePreview'
import { CustomMessageInput } from './composer/CustomMessageInput'
import { SendActions } from './composer/SendActions'

const STORAGE_KEY = 'callout-composer-state'

export function MessageComposer() {
  const { address: walletAddress, isConnected } = useAccount()
  const chainId = useChainId()
  const toast = useToast()
  const { open } = useAppKit()

  // Card styles - use container mode (with padding) for cards that contain content
  const cardStyleContainer = useCardStyle(true)

  // Theme-aware text colors
  const textSecondary = useThemeTextColor('secondary')
  const redBorderStrong = useAccentBorderColor('red', 'borderStrong')
  const redText = useAccentTextColor('red')
  const redBgButton = useAccentBgColor('red', 'bgButton')

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
  const [parsedTx, setParsedTx] = useState<ParsedTransaction | null>(null)

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
  // Track the last template/wallet combo to avoid re-injecting unnecessarily
  const lastInjectedRef = useRef<{ templateId: string | null; wallet: string | null }>({ templateId: null, wallet: null })

  useEffect(() => {
    if (
      selectedTemplate &&
      walletAddress &&
      selectedTemplate.variables.some((v) => v.key === 'receive_address') &&
      !variableValues['receive_address'] &&
      !receiveAddressManuallyCleared.current
    ) {
      // Only inject if this is a new template/wallet combination
      const currentKey = `${selectedTemplate.id}-${walletAddress}`
      const lastKey = `${lastInjectedRef.current.templateId}-${lastInjectedRef.current.wallet}`

      if (currentKey !== lastKey) {
        setVariableValues((prev) => ({ ...prev, receive_address: walletAddress }))
        lastInjectedRef.current = { templateId: selectedTemplate.id, wallet: walletAddress }
      }
    } else {
      // Reset tracking when conditions aren't met
      lastInjectedRef.current = { templateId: null, wallet: null }
    }
  }, [selectedTemplate, walletAddress, variableValues])

  // ── Build the final message ──────────────────────────────────────
  const finalMessage = useMemo(() => {
    if (isCustomMode) return customMessage
    if (!selectedTemplate) return ''
    return applyTemplate(selectedTemplate, variableValues)
  }, [isCustomMode, customMessage, selectedTemplate, variableValues])

  // ── Derive contextual target label from the selected template category ──
  const targetLabel = useMemo(() => {
    if (!selectedCategoryId) return 'target'
    const category = templateCategories.find(c => c.id === selectedCategoryId)
    return category?.targetLabel ?? 'target'
  }, [selectedCategoryId])

  // ── Encode to calldata ───────────────────────────────────────────
  // Non-encrypted calldata can be computed synchronously with useMemo
  const nonEncryptedCalldata = useMemo(() => {
    if (!finalMessage) return undefined
    if (encryptEnabled && encryptPublicKey) return undefined // Will be handled by async effect
    return encodeMessage(finalMessage)
  }, [finalMessage, encryptEnabled, encryptPublicKey])

  // Encrypted calldata requires async operation, so we use useState + useEffect
  const [encryptedCalldata, setEncryptedCalldata] = useState<Hex | undefined>(undefined)
  const encryptionKeyRef = useRef<string>('')

  useEffect(() => {
    if (!finalMessage || !encryptEnabled || !encryptPublicKey) {
      setEncryptedCalldata(undefined)
      encryptionKeyRef.current = ''
      return
    }

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
      setEncryptedCalldata(undefined)
      encryptionKeyRef.current = ''
      return
    }

    // Track this encryption request to cancel stale ones
    const currentKey = `${finalMessage}-${encryptPublicKey}`
    encryptionKeyRef.current = currentKey
    let cancelled = false

    encryptMessage(finalMessage, encryptPublicKey)
      .then((encryptedHex) => {
        // Only update if this is still the current encryption request
        if (!cancelled && encryptionKeyRef.current === currentKey) {
          setEncryptedCalldata(`0x${encryptedHex}` as Hex)
        }
      })
      .catch((err) => {
        // Encryption failed — clear calldata so stale data isn't sent
        if (!cancelled && encryptionKeyRef.current === currentKey) {
          setEncryptedCalldata(undefined)
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

    return () => {
      cancelled = true
    }
  }, [finalMessage, encryptEnabled, encryptPublicKey, toast])

  // Final calldata: use encrypted if available, otherwise use non-encrypted
  const calldata = encryptEnabled && encryptPublicKey ? encryptedCalldata : nonEncryptedCalldata

  const isValidTarget = targetAddress ? isAddress(targetAddress) : false

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
    receiveAddressManuallyCleared.current = false
  }, [])

  const handleTemplateSelect = useCallback((template: MessageTemplate) => {
    setSelectedTemplate(template)
    // Pre-fill receive_address with connected wallet and set defaults
    const initial: Record<string, string> = {}
    for (const v of template.variables) {
      if (v.key === 'receive_address' && walletAddress && !receiveAddressManuallyCleared.current) {
        initial[v.key] = walletAddress
      } else if (v.key === 'recovery_percentage') {
        // Default recovery percentage to 90%
        initial[v.key] = '90'
      } else {
        initial[v.key] = ''
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
    receiveAddressManuallyCleared.current = false
  }, [])


  const handleCategorySelectWithNull = useCallback((categoryId: TemplateCategoryId | null) => {
    if (categoryId === null) {
      handleBackToCategories()
    } else {
      handleCategorySelect(categoryId)
    }
  }, [handleCategorySelect, handleBackToCategories])

  // ── Handle parsed transaction ───────────────────────────────────────
  const handleParsedTx = useCallback((parsed: ParsedTransaction) => {
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

      // Ensure receive_address defaults to connected wallet if template requires it
      // and user hasn't manually cleared it
      if (
        walletAddress &&
        selectedTemplate.variables.some((v) => v.key === 'receive_address') &&
        !updated['receive_address'] &&
        !receiveAddressManuallyCleared.current
      ) {
        updated['receive_address'] = walletAddress
      }

      setVariableValues(updated)
    }
  }, [selectedTemplate, variableValues, walletAddress])

  return (
    <VStack spacing={4} align="stretch">
      {/* ── Network & Target Address (combined) ── */}
      <Box {...cardStyleContainer}>
        <SectionLabel icon="🎯" label="Network & Target Address" accent={textSecondary} />
        <HStack spacing={3} align="stretch">
          <NetworkSelector noCard={true} />
          <Box flex={1} minW={0}>
            <TargetAddressInput
              value={targetAddress}
              onChange={(value) => {
                setTargetAddress(value)
                if (parsedTx) setParsedTx(null)
              }}
              onParsed={handleParsedTx}
              noCard={true}
            />
          </Box>
        </HStack>
      </Box>

      {/* ── Message Template Section ── */}
      <Box {...cardStyleContainer}>
        <SectionLabel icon="✉" label="Compose Message" />

        {/* Template selector or custom mode */}
        {!selectedTemplate && !isCustomMode && (
          <TemplateSelector
            onTemplateSelect={handleTemplateSelect}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={handleCategorySelectWithNull}
            showCustom={true}
            onCustomSelect={handleCustomMode}
          />
        )}

        {/* Variable form + preview (template selected) */}
        {selectedTemplate && !isCustomMode && (
          <>
            <VariableForm
              template={selectedTemplate}
              variableValues={variableValues}
              onVariableChange={handleVariableChange}
              selectedCategoryId={selectedCategoryId}
            />
            {/* Encryption controls - between progress bar and message states */}
            <EncryptionControls
              enabled={encryptEnabled}
              onEnabledChange={setEncryptEnabled}
              publicKey={encryptPublicKey}
              onPublicKeyChange={setEncryptPublicKey}
              targetAddress={targetAddress}
              targetLabel={targetLabel}
              chainId={chainId}
            />
            {/* Multi-state preview - shows template, interpolated, hex, and encrypted hex */}
            {(finalMessage || calldata) && (
              <Box mt={4} mx={{ base: -4, md: -6 }}>
                <MessageStatePreview
                  template={selectedTemplate?.template}
                  interpolatedMessage={finalMessage}
                  hexCalldata={nonEncryptedCalldata}
                  encryptedHexCalldata={encryptedCalldata}
                  encryptEnabled={encryptEnabled && !!encryptPublicKey}
                  selectedTemplate={selectedTemplate}
                />
              </Box>
            )}
          </>
        )}

        {/* Custom message mode */}
        {isCustomMode && (
          <>
            <CustomMessageInput
              value={customMessage}
              onChange={setCustomMessage}
              onBack={handleBackToCategories}
            />
            {/* Encryption controls - between custom input and message states */}
            <EncryptionControls
              enabled={encryptEnabled}
              onEnabledChange={setEncryptEnabled}
              publicKey={encryptPublicKey}
              onPublicKeyChange={setEncryptPublicKey}
              targetAddress={targetAddress}
              targetLabel={targetLabel}
              chainId={chainId}
            />
            {/* Multi-state preview for custom mode */}
            {(customMessage || calldata) && (
              <Box mt={4} mx={{ base: -4, md: -6 }}>
                <MessageStatePreview
                  interpolatedMessage={customMessage}
                  hexCalldata={nonEncryptedCalldata}
                  encryptedHexCalldata={encryptedCalldata}
                  encryptEnabled={encryptEnabled && !!encryptPublicKey}
                />
              </Box>
            )}
          </>
        )}

        {/* Connect Wallet button - at bottom of Compose Message card when not connected */}
        {!isConnected && (
          <Box
            mx={{ base: -4, md: -6 }}
            mt={4}
            mb={{ base: -4, md: -6 }}
          >
            <Button
              size="lg"
              width="full"
              h="60px"
              fontSize="md"
              fontWeight="900"
              letterSpacing="0.1em"
              textTransform="uppercase"
              variant="outline"
              border="2px solid"
              borderColor={redBorderStrong}
              color={redText}
              borderRadius={0}
              onClick={() => open()}
              _hover={{
                bg: redBgButton,
                borderColor: redBorderStrong,
                color: 'white',
              }}
              transition="all 0.1s"
            >
              🔌 Connect Wallet
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Preview & Send ── */}
      {isConnected && (
        <SendActions
        message={finalMessage}
        calldata={calldata}
        targetAddress={targetAddress}
        isValidTarget={isValidTarget}
        signMode={signMode}
        isSending={isSending}
        lastSignature={lastSignature}
        lastTxHash={lastTxHash}
        onSignModeToggle={() => {
          setSignMode(!signMode)
          setLastSignature(null)
          setLastTxHash(null)
        }}
        onSend={handleSend}
        onSign={handleSign}
        />
      )}
    </VStack>
  )
}
