import { VStack } from '@chakra-ui/react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from '@chakra-ui/react'
import { decodeMessage, isLikelyText } from '@callout/shared/encoding'
import { decryptMessage, isEncrypted } from '@callout/shared/encryption'
import { fetchTransaction, isTxHash } from '../services/blockchain'
import { classifyError, withRetry } from '@callout/shared/errors'
import { validateTxHash } from '@callout/shared/validation'
import { type Hex, type Address } from 'viem'
import { parseSignedMessage, recoverAddressFromSignedMessage } from '@callout/shared/crypto'
import { identifyTemplate, type MessageTemplate, extractTemplateData, type ExtractedTemplateData } from '@callout/shared/templates'
import { parseTheftTransaction, type ParsedTransaction } from '../services/transactionParser'
import { networks } from '../config/web3'
import { chains } from '../services/blockchain'
import { DecryptInput } from './decrypt/DecryptInput'
import { DecryptError } from './decrypt/DecryptError'
import { DecodingAnimation } from './decrypt/DecodingAnimation'
import { DecodedResult } from './decrypt/DecodedResult'

/* ── component ─────────────────────────────────────────── */

const STORAGE_KEY = 'decrypt-message-input'

export function DecryptMessage() {
  const toast = useToast()

  // Initialize input value from localStorage
  const [inputValue, setInputValue] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })
  const [passphrase, setPassphrase] = useState('')
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null)
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null)
  const [txMeta, setTxMeta] = useState<{
    from: string
    to: string | null
    chainId: number
    hash: string
  } | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isDecoding, setIsDecoding] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recoveredAddress, setRecoveredAddress] = useState<Address | null>(null)
  const [identifiedTemplate, setIdentifiedTemplate] = useState<MessageTemplate | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedTemplateData | null>(null)
  const [parsedTransaction, setParsedTransaction] = useState<ParsedTransaction | null>(null)
  const [isFetchingTransaction, setIsFetchingTransaction] = useState(false)
  const [chainId, setChainId] = useState<string>('1')

  // Track last processed input to prevent re-processing
  const lastProcessedInputRef = useRef<string>('')

  // Detect input type
  const inputTrimmed = inputValue.trim()
  const inputIsTxHash = isTxHash(inputTrimmed)

  const handleDecode = useCallback(async () => {
    // Mark that we're processing this input
    lastProcessedInputRef.current = inputTrimmed

    setError(null)
    setDecodedMessage(null)
    setDecryptedMessage(null)
    setTxMeta(null)
    setShowResult(false)
    setRecoveredAddress(null)
    setIdentifiedTemplate(null)
    setExtractedData(null)
    setParsedTransaction(null)

    // Validate transaction hash format if applicable
    if (inputIsTxHash) {
      const validation = validateTxHash(inputTrimmed)
      if (!validation.isValid) {
        setError(`${validation.error}. ${validation.suggestion}`)
        return
      }
    }

    setIsDecoding(true)

    try {
      let calldata: string

      if (inputIsTxHash) {
        // Fetch transaction from blockchain RPC with retry logic
        const selectedChainId = chainId ? parseInt(chainId, 10) : undefined
        const tx = await withRetry(
          async () => fetchTransaction(inputTrimmed as Hex, selectedChainId),
          {
            maxAttempts: 3,
            delayMs: 1500,
            backoff: true,
          }
        )

        calldata = tx.input
        setTxMeta({
          from: tx.from,
          to: tx.to,
          chainId: tx.chainId,
          hash: tx.hash,
        })

        if (!calldata || calldata === '0x') {
          setIsDecoding(false)
          setError(`Transaction ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)} on ${chains[tx.chainId]?.name || `Chain ${tx.chainId}`} has no calldata (empty input). This is likely a simple ETH transfer and doesn't contain a message.`)
          setShowResult(true)
          return
        }
      } else {
        // Raw calldata input
        calldata = inputTrimmed.startsWith('0x') ? inputTrimmed : `0x${inputTrimmed}`
      }

      const decoded = decodeMessage(calldata as Hex)
      if (!isLikelyText(calldata as Hex)) {
        setError('The decoded data does not appear to be a text message. It may be contract call data.')
        setDecodedMessage(decoded)
        setIsDecoding(false)
        setShowResult(true)
        return
      }
      setDecodedMessage(decoded)

      // Try to identify which template this message matches
      const template = identifyTemplate(decoded)
      setIdentifiedTemplate(template)

      // Extract structured data from the template
      if (template) {
        const extracted = extractTemplateData(decoded, template)
        setExtractedData(extracted)
      } else {
        setExtractedData(null)
      }

      // Check if the decoded message matches the signed message format
      const parsedSigned = parseSignedMessage(decoded)
      let recovered: Address | null = null
      if (parsedSigned) {
        // Try to recover the address from the signature
        recovered = await recoverAddressFromSignedMessage(parsedSigned)
        setRecoveredAddress(recovered)
      } else {
        setRecoveredAddress(null)
      }

      // Let scramble animation play, then reveal
      setTimeout(() => {
        setIsDecoding(false)
        setShowResult(true)

        if (isEncrypted(decoded)) {
          toast({
            title: '🔒 Encrypted message detected',
            description: 'Enter the private key to unlock.',
            status: 'info',
            duration: 4000,
          })
        } else if (parsedSigned && recovered) {
          toast({
            title: '✓ Signature verified',
            description: `Message signed by ${recovered.slice(0, 6)}...${recovered.slice(-4)}`,
            status: 'success',
            duration: 4000,
          })
        }
      }, 950)
    } catch (err) {
      setIsDecoding(false)
      const errorContext = classifyError(err, {
        component: 'DecryptMessage',
        inputType: inputIsTxHash ? 'txHash' : 'calldata',
      })

      errorContext.log( 'DecryptMessage.handleDecode')

      // Show contextual error message
      setError(`${errorContext.userMessage}: ${errorContext.actionableSteps.join(' • ')}`)
    }
  }, [inputTrimmed, inputIsTxHash, toast])

  // Persist input value to localStorage whenever it changes
  useEffect(() => {
    try {
      if (inputValue.trim()) {
        localStorage.setItem(STORAGE_KEY, inputValue)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }, [inputValue])

  // Auto-process input when valid (moved after handleDecode definition)
  useEffect(() => {
    // Clear results if input is cleared
    if (!inputTrimmed) {
      lastProcessedInputRef.current = ''
      setError(null)
      setDecodedMessage(null)
      setDecryptedMessage(null)
      setTxMeta(null)
      setShowResult(false)
      setRecoveredAddress(null)
      setIdentifiedTemplate(null)
      setExtractedData(null)
      setParsedTransaction(null)
      return
    }

    // Don't process if already decoding or if we've already processed this exact input
    if (isDecoding || lastProcessedInputRef.current === inputTrimmed) {
      return
    }

    // For transaction hashes, wait for complete hash (66 chars: 0x + 64 hex chars)
    if (inputIsTxHash) {
      if (inputTrimmed.length === 66) {
        // Complete tx hash, process immediately
        lastProcessedInputRef.current = inputTrimmed
        handleDecode()
      }
      return
    }

    // For raw calldata, debounce and process when we have enough characters
    // Minimum: at least 4 hex chars (2 bytes) after 0x prefix, or 2 chars without prefix
    const minLength = inputTrimmed.startsWith('0x') ? 6 : 2
    if (inputTrimmed.length < minLength) {
      return
    }

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      // Double-check we haven't processed this input while waiting
      if (lastProcessedInputRef.current !== inputTrimmed && !isDecoding) {
        lastProcessedInputRef.current = inputTrimmed
        handleDecode()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputTrimmed, inputIsTxHash, isDecoding])

  const handleFetchTransaction = useCallback(async () => {
    if (!extractedData?.theftTxHash) return

    setIsFetchingTransaction(true)
    setError(null)

    try {
      // Try to get chain ID from extracted data first, then fall back to txMeta
      // extractedData.chainId is a string, so check if it exists and is not empty
      let chainId: number | undefined
      if (extractedData.chainId && extractedData.chainId.trim()) {
        const parsed = parseInt(extractedData.chainId)
        if (!isNaN(parsed) && parsed > 0) {
          chainId = parsed
        }
      }

      // Fall back to txMeta chainId if not found in extracted data
      if (chainId === undefined) {
        chainId = txMeta?.chainId
      }

      if (typeof chainId !== 'number') {
        setError('Chain ID is required to fetch transaction. Please ensure the message includes a chain ID or decode a transaction hash first.')
        setIsFetchingTransaction(false)
        return
      }

      const parsed = await parseTheftTransaction(extractedData.theftTxHash, chainId)
      setParsedTransaction(parsed)

      toast({
        title: '✓ Transaction Parsed',
        description: `Found ${parsed.transfers.length} transfers`,
        status: 'success',
        duration: 3000,
      })
    } catch (err) {
      const errorContext = classifyError(err, {
        component: 'DecryptMessage',
        action: 'fetchTransaction',
      })
      errorContext.log( 'DecryptMessage.handleFetchTransaction')

      const chainId = extractedData.chainId ? parseInt(extractedData.chainId) : (txMeta?.chainId || 1)

      // Check if chain is in the supported networks list
      const supportedChainIds = networks.map(n => Number(n.id))
      const isUnsupportedChain = !supportedChainIds.includes(chainId)
      const chainName = networks.find(n => Number(n.id) === chainId)?.name || `Chain ${chainId}`

      // Provide detailed error message based on error type
      let errorMessage: string
      const originalError = err instanceof Error ? err.message : String(err)

      // Check if backend server is not running
      if (originalError.includes('ECONNREFUSED') || originalError.includes('Failed to connect') || originalError.includes('Network error')) {
        errorMessage = `Backend API server is not running. Please start it with: cd api && yarn run dev`
      } else if (errorContext.userMessage.includes('Unsupported chain') || isUnsupportedChain) {
        errorMessage = `${chainName} (${chainId}) is not supported for transaction parsing. Transaction parsing uses Etherscan-compatible APIs. Supported chains: ${supportedChainIds.slice(0, 10).join(', ')}${supportedChainIds.length > 10 ? `, and ${supportedChainIds.length - 10} more` : ''}. Note: Some chains like PulseChain (369) don't have Etherscan-compatible APIs.`
      } else if (errorContext.userMessage.includes('not found') || errorContext.userMessage.includes('Transaction not found') || originalError.includes('not found')) {
        errorMessage = `Transaction not found on ${chainName} (${chainId}) via Etherscan API. Possible reasons: (1) Transaction hash is incorrect, (2) Transaction is on a different network, (3) Transaction is too recent and not yet indexed, or (4) This chain may not have an Etherscan-compatible API.`
      } else if (errorContext.userMessage.includes('rate limit') || originalError.includes('rate limit')) {
        errorMessage = `Etherscan API rate limit exceeded. Please wait a moment and try again.`
      } else {
        // Show the actual error message instead of generic "unexpected error"
        errorMessage = `Failed to fetch transaction via Etherscan API: ${originalError}`
      }

      setError(errorMessage)

      toast({
        title: '⚠️ Transaction Fetch Failed',
        description: errorMessage,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    } finally {
      setIsFetchingTransaction(false)
    }
  }, [extractedData, txMeta, toast, networks])

  const handleDecrypt = useCallback(async () => {
    if (!decodedMessage || !passphrase) return
    setIsDecrypting(true)
    setError(null)

    try {
      const plain = await decryptMessage(decodedMessage, passphrase)
      setDecryptedMessage(plain)
      toast({
        title: '✓ Decrypted successfully!',
        status: 'success',
        duration: 3000,
      })
    } catch (err) {
      const errorContext = classifyError(err, {
        component: 'DecryptMessage',
        action: 'decrypt',
      })

      errorContext.log( 'DecryptMessage.handleDecrypt')

      setError(`${errorContext.userMessage}: ${errorContext.actionableSteps.join(' • ')}`)

      toast({
        title: '⚠️ Decryption Failed',
        description: errorContext.actionableSteps[0],
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDecrypting(false)
    }
  }, [decodedMessage, passphrase, toast])

  return (
    <VStack spacing={3} align="stretch">
      <DecryptInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        inputIsTxHash={inputIsTxHash}
        chainId={chainId}
        onChainIdChange={setChainId}
      />

      <DecryptError error={error} />

      <DecodingAnimation
        isDecoding={isDecoding}
        decodedMessage={decodedMessage}
        inputIsTxHash={inputIsTxHash}
      />

      <DecodedResult
        showResult={showResult}
        decodedMessage={decodedMessage}
        txMeta={txMeta}
        recoveredAddress={recoveredAddress}
        identifiedTemplate={identifiedTemplate}
        extractedData={extractedData}
        parsedTransaction={parsedTransaction}
        chainId={txMeta?.chainId}
        onFetchTransaction={handleFetchTransaction}
        isFetchingTransaction={isFetchingTransaction}
        passphrase={passphrase}
        onPassphraseChange={setPassphrase}
        onDecrypt={handleDecrypt}
        isDecrypting={isDecrypting}
        decryptedMessage={decryptedMessage}
      />
    </VStack>
  )
}
