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
  Collapse,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { decodeMessage, isLikelyText } from '../utils/encoding'
import { decryptMessage, isEncryptedMessage } from '../utils/encryption'

/* ── keyframe animations ───────────────────────────────── */

const scanLine = keyframes`
  0%   { top: 0%; }
  100% { top: 100%; }
`

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(99,179,237,0.15); }
  50%      { box-shadow: 0 0 20px rgba(99,179,237,0.35), 0 0 40px rgba(99,179,237,0.1); }
`

const vaultPulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(236,201,75,0.1); }
  50%      { box-shadow: 0 0 24px rgba(236,201,75,0.3), 0 0 48px rgba(236,201,75,0.08); }
`

const textReveal = keyframes`
  0%   { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
`

/* ── card base style ───────────────────────────────────── */

const cardStyle = {
  bg: 'rgba(14, 14, 30, 0.6)',
  borderRadius: '2xl',
  border: '1px solid',
  borderColor: 'whiteAlpha.50',
  p: { base: 4, md: 6 },
}

/* ── scramble characters for decode animation ──────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>{}[]'

function useScrambleText(target: string | null, active: boolean, durationMs = 900) {
  const [display, setDisplay] = useState<string | null>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!active || !target) {
      if (!active) setDisplay(null)
      return
    }

    const len = target.length
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      const revealed = Math.floor(progress * len)

      let out = ''
      for (let i = 0; i < len; i++) {
        if (i < revealed) {
          out += target[i]
        } else {
          out += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }
      setDisplay(out)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, active, durationMs])

  return display
}

/* ── component ─────────────────────────────────────────── */

export function DecryptMessage() {
  const { isConnected: _isConnected } = useAccount()
  const toast = useToast()

  const [calldataInput, setCalldataInput] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null)
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isDecoding, setIsDecoding] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scramble effect while decoding
  const scrambled = useScrambleText(decodedMessage, isDecoding, 900)

  const handleDecode = useCallback(() => {
    setError(null)
    setDecodedMessage(null)
    setDecryptedMessage(null)
    setShowResult(false)
    setIsDecoding(true)

    let hex = calldataInput.trim()
    if (!hex.startsWith('0x')) {
      hex = '0x' + hex
    }

    // Simulate a brief decode delay for the animation
    setTimeout(() => {
      try {
        const decoded = decodeMessage(hex as `0x${string}`)
        if (!isLikelyText(hex as `0x${string}`)) {
          setError('The decoded data does not appear to be a text message.')
          setDecodedMessage(decoded)
          setIsDecoding(false)
          setShowResult(true)
          return
        }
        setDecodedMessage(decoded)

        // Let scramble animation play, then reveal
        setTimeout(() => {
          setIsDecoding(false)
          setShowResult(true)

          if (isEncryptedMessage(decoded)) {
            toast({
              title: '🔒 Encrypted message detected',
              description: 'Enter the passphrase to unlock.',
              status: 'info',
              duration: 4000,
            })
          }
        }, 950)
      } catch {
        setIsDecoding(false)
        setError('Failed to decode. Make sure the input is valid hex calldata.')
      }
    }, 200)
  }, [calldataInput, toast])

  const handleDecrypt = useCallback(async () => {
    if (!decodedMessage || !passphrase) return
    setIsDecrypting(true)
    setError(null)

    try {
      const plain = await decryptMessage(decodedMessage, passphrase)
      setDecryptedMessage(plain)
      toast({
        title: '🔓 Decrypted!',
        status: 'success',
        duration: 3000,
      })
    } catch {
      setError('Decryption failed. Wrong passphrase or corrupted data.')
    } finally {
      setIsDecrypting(false)
    }
  }, [decodedMessage, passphrase, toast])

  return (
    <VStack spacing={4} align="stretch">
      {/* Input Section */}
      <Box
        {...cardStyle}
        borderColor="rgba(99, 179, 237, 0.12)"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgGradient: 'linear(to-r, transparent, rgba(99,179,237,0.3), transparent)',
        }}
      >
        <HStack spacing={3} mb={4}>
          {/* Lock/key icon badge */}
          <Box
            w="32px"
            h="32px"
            borderRadius="lg"
            bg="rgba(99, 179, 237, 0.08)"
            border="1px solid"
            borderColor="rgba(99, 179, 237, 0.2)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Text fontSize="sm">🗝️</Text>
          </Box>
          <Box>
            <Text
              fontSize="xs"
              fontWeight="800"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color="blue.300"
            >
              Decode Calldata
            </Text>
            <Text fontSize="xs" color="whiteAlpha.300" mt={0.5}>
              Paste a tx hash or raw hex input data
            </Text>
          </Box>
        </HStack>

        <Textarea
          placeholder="0x48656c6c6f... or raw hex calldata"
          value={calldataInput}
          onChange={(e) => setCalldataInput(e.target.value)}
          fontFamily="mono"
          fontSize="sm"
          bg="rgba(6, 6, 15, 0.8)"
          borderColor="whiteAlpha.100"
          color="whiteAlpha.700"
          rows={4}
          mb={3}
          _placeholder={{ color: 'whiteAlpha.200' }}
          _focus={{
            borderColor: 'blue.400',
            boxShadow: '0 0 0 1px rgba(99, 179, 237, 0.3), 0 0 20px rgba(99, 179, 237, 0.08)',
          }}
        />
        <Button
          size="lg"
          width="full"
          h="48px"
          fontSize="sm"
          fontWeight="800"
          letterSpacing="0.05em"
          textTransform="uppercase"
          onClick={handleDecode}
          isDisabled={!calldataInput.trim() || isDecoding}
          isLoading={isDecoding}
          loadingText="Decoding..."
          bg="rgba(99, 179, 237, 0.15)"
          color="blue.300"
          border="1px solid"
          borderColor="rgba(99, 179, 237, 0.25)"
          borderRadius="xl"
          _hover={{
            bg: 'rgba(99, 179, 237, 0.25)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 20px rgba(99, 179, 237, 0.15)',
          }}
          _active={{
            transform: 'translateY(0)',
          }}
          _disabled={{
            bg: 'whiteAlpha.50',
            color: 'whiteAlpha.300',
            borderColor: 'whiteAlpha.50',
            cursor: 'not-allowed',
            _hover: {
              bg: 'whiteAlpha.50',
              transform: 'none',
              boxShadow: 'none',
            },
          }}
          transition="all 0.2s"
        >
          🔓 Crack It Open
        </Button>
      </Box>

      {/* Error */}
      <Collapse in={!!error} animateOpacity>
        {error && (
          <Box
            p={4}
            borderRadius="xl"
            bg="rgba(236, 201, 75, 0.06)"
            border="1px solid"
            borderColor="rgba(236, 201, 75, 0.2)"
          >
            <HStack>
              <Text fontSize="sm" color="yellow.300">⚠</Text>
              <Text fontSize="sm" color="yellow.200">
                {error}
              </Text>
            </HStack>
          </Box>
        )}
      </Collapse>

      {/* Decoding Animation — scramble effect */}
      <Collapse in={isDecoding} animateOpacity>
        {isDecoding && (
          <Box
            {...cardStyle}
            borderColor="rgba(99, 179, 237, 0.25)"
            position="relative"
            overflow="hidden"
            animation={`${glowPulse} 1.5s ease-in-out infinite`}
          >
            {/* Scan line effect */}
            <Box
              position="absolute"
              left={0}
              right={0}
              height="2px"
              bg="rgba(99, 179, 237, 0.4)"
              boxShadow="0 0 12px rgba(99, 179, 237, 0.5)"
              animation={`${scanLine} 1.2s linear infinite`}
              zIndex={2}
            />
            <HStack spacing={2} mb={3}>
              <Text fontSize="md">⚡</Text>
              <Text
                fontSize="xs"
                fontWeight="800"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="blue.300"
              >
                Decoding...
              </Text>
            </HStack>
            <Box
              bg="rgba(6, 6, 15, 0.9)"
              p={4}
              borderRadius="xl"
              border="1px solid"
              borderColor="rgba(99, 179, 237, 0.15)"
              fontFamily="mono"
              fontSize="sm"
              color="blue.200"
              whiteSpace="pre-wrap"
              lineHeight="1.7"
              opacity={0.8}
            >
              {scrambled || '...'}
            </Box>
          </Box>
        )}
      </Collapse>

      {/* Decoded Result */}
      <Collapse in={showResult && decodedMessage !== null} animateOpacity>
        {showResult && decodedMessage !== null && (
          <Box
            {...cardStyle}
            borderColor="rgba(72, 187, 120, 0.15)"
            position="relative"
            overflow="hidden"
            animation={`${textReveal} 0.4s ease-out`}
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              bgGradient: 'linear(to-r, transparent, rgba(72,187,120,0.3), transparent)',
            }}
          >
            <HStack spacing={3} mb={4}>
              <Box
                w="32px"
                h="32px"
                borderRadius="lg"
                bg="rgba(72, 187, 120, 0.1)"
                border="1px solid"
                borderColor="rgba(72, 187, 120, 0.25)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Text fontSize="sm">📬</Text>
              </Box>
              <Text
                fontSize="xs"
                fontWeight="800"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="green.300"
              >
                Message Decoded
              </Text>
            </HStack>
            <Box
              bg="rgba(6, 6, 15, 0.9)"
              p={4}
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.50"
            >
              <Text
                fontSize="sm"
                whiteSpace="pre-wrap"
                color="whiteAlpha.700"
                lineHeight="1.7"
                fontFamily="mono"
              >
                {decodedMessage}
              </Text>
            </Box>

            {/* Vault-style passphrase input for encrypted messages */}
            {isEncryptedMessage(decodedMessage) && (
              <Box
                mt={5}
                p={4}
                borderRadius="xl"
                bg="rgba(236, 201, 75, 0.04)"
                border="1px solid"
                borderColor="rgba(236, 201, 75, 0.15)"
                position="relative"
                overflow="hidden"
                animation={`${vaultPulse} 3s ease-in-out infinite`}
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  bgGradient: 'linear(to-r, transparent, rgba(236,201,75,0.3), transparent)',
                }}
              >
                <HStack spacing={3} mb={3}>
                  <Box
                    w="28px"
                    h="28px"
                    borderRadius="lg"
                    bg="rgba(236, 201, 75, 0.1)"
                    border="1px solid"
                    borderColor="rgba(236, 201, 75, 0.25)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Text fontSize="xs">🔐</Text>
                  </Box>
                  <Box>
                    <Text
                      fontSize="xs"
                      color="yellow.300"
                      fontWeight="800"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                    >
                      Encrypted Payload
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.300" mt={0.5}>
                      Enter the passphrase to unlock this message
                    </Text>
                  </Box>
                </HStack>
                <HStack spacing={2}>
                  <Input
                    placeholder="Enter passphrase..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && passphrase) handleDecrypt()
                    }}
                    type="password"
                    fontSize="sm"
                    fontFamily="mono"
                    bg="rgba(6, 6, 15, 0.8)"
                    borderColor="rgba(236, 201, 75, 0.15)"
                    color="yellow.100"
                    h="44px"
                    letterSpacing="0.15em"
                    _placeholder={{ color: 'whiteAlpha.200', letterSpacing: '0.02em' }}
                    _focus={{
                      borderColor: 'yellow.400',
                      boxShadow: '0 0 0 1px rgba(236, 201, 75, 0.3), 0 0 16px rgba(236, 201, 75, 0.08)',
                    }}
                  />
                  <Button
                    h="44px"
                    px={6}
                    fontSize="sm"
                    fontWeight="800"
                    letterSpacing="0.04em"
                    textTransform="uppercase"
                    bg="rgba(236, 201, 75, 0.15)"
                    color="yellow.300"
                    border="1px solid"
                    borderColor="rgba(236, 201, 75, 0.25)"
                    borderRadius="lg"
                    onClick={handleDecrypt}
                    isLoading={isDecrypting}
                    loadingText="..."
                    isDisabled={!passphrase}
                    _hover={{
                      bg: 'rgba(236, 201, 75, 0.25)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 16px rgba(236, 201, 75, 0.12)',
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    _disabled={{
                      opacity: 0.4,
                      cursor: 'not-allowed',
                      _hover: { bg: 'rgba(236, 201, 75, 0.15)', transform: 'none', boxShadow: 'none' },
                    }}
                    transition="all 0.2s"
                  >
                    🗝️ Unlock
                  </Button>
                </HStack>
              </Box>
            )}

            {/* Decrypted result */}
            <Collapse in={!!decryptedMessage} animateOpacity>
              {decryptedMessage && (
                <Box
                  mt={4}
                  p={4}
                  bg="rgba(72, 187, 120, 0.08)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="rgba(72, 187, 120, 0.25)"
                  animation={`${textReveal} 0.4s ease-out`}
                >
                  <HStack spacing={2} mb={2}>
                    <Text fontSize="sm">🔓</Text>
                    <Text fontSize="xs" color="green.300" fontWeight="800" letterSpacing="0.08em" textTransform="uppercase">
                      Unlocked
                    </Text>
                  </HStack>
                  <Code
                    bg="transparent"
                    color="green.300"
                    whiteSpace="pre-wrap"
                    display="block"
                    fontSize="sm"
                    fontFamily="mono"
                    lineHeight="1.7"
                  >
                    {decryptedMessage}
                  </Code>
                </Box>
              )}
            </Collapse>
          </Box>
        )}
      </Collapse>
    </VStack>
  )
}
