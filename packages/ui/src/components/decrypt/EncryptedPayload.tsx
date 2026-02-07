import { Box, HStack, Text, Input, Button } from '@chakra-ui/react'
import { borderRadius } from '../../config/themeTokens'
import { useThemeBgColor, useThemeTextColor, useAccentBgColor, useAccentBorderColor, useAccentTextColor, useAccentGradient, useAccentSpecialColor } from '../../shared/useThemeColors'
import { vaultPulse } from './animations'

interface EncryptedPayloadProps {
  passphrase: string
  onPassphraseChange: (value: string) => void
  onDecrypt: () => void
  isDecrypting: boolean
}

/**
 * Encrypted payload input section.
 * Displays vault-style UI for entering decryption passphrase.
 */
export function EncryptedPayload({
  passphrase,
  onPassphraseChange,
  onDecrypt,
  isDecrypting,
}: EncryptedPayloadProps) {
  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')
  const inputPlaceholder = useThemeTextColor('extraMuted')
  const textMuted = useThemeTextColor('muted')

  const yellowEncryptedBorder = useAccentBorderColor('yellow', 'borderEncrypted')
  const yellowBorderShadow = `0 0 0 1px ${yellowEncryptedBorder}`
  const yellowEncryptedIconBg = useAccentBgColor('yellow', 'bgIcon')
  const yellowEncryptedIconBorder = useAccentBorderColor('yellow', 'borderIcon')
  const yellowEncryptedGradient = useAccentGradient('yellow')
  const encryptedInputBoxShadow = useAccentSpecialColor('yellow', 'inputBoxShadow')
  const encryptedButtonBg = useAccentBgColor('yellow', 'bgButton')
  const encryptedButtonColor = useAccentTextColor('yellow')
  const encryptedButtonBoxShadow = useAccentSpecialColor('yellow', 'buttonBoxShadow')
  const yellowText = useAccentTextColor('yellow')
  const yellowButtonHoverBg = useAccentBgColor('yellow', 'bgButtonHover')
  const yellowButtonHoverShadow = useAccentSpecialColor('yellow', 'buttonShadow')
  const yellowButtonDisabledBg = useAccentBgColor('yellow', 'bgButtonDisabled')
  const yellowFocusBorder = useAccentSpecialColor('yellow', 'focusBorder')
  const yellowFocusShadow = useAccentSpecialColor('yellow', 'focusShadow')
  const yellowFocusGlow = useAccentSpecialColor('yellow', 'focusGlow')
  const cardBg = useThemeBgColor('card')

  return (
    <Box
      py={2}
      px={0}
      borderRadius={borderRadius.none}
      bg={cardBg}
      border="none"
      boxShadow={yellowBorderShadow}
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
        bgGradient: `linear(to-r, transparent, ${yellowEncryptedGradient}, transparent)`,
      }}
    >
      <Box px={4}>
      <HStack spacing={3} mb={1.5}>
        <Box
          w="28px"
          h="28px"
          borderRadius={borderRadius.none}
          bg={yellowEncryptedIconBg}
          border="1px solid"
          borderColor={yellowEncryptedIconBorder}
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
            color={yellowText}
            fontWeight="800"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            Encrypted Payload
          </Text>
          <Text fontSize="xs" color={textMuted} mt={0.5}>
            Enter the passphrase to unlock this message
          </Text>
        </Box>
      </HStack>
      <HStack spacing={2}>
        <Input
          placeholder="Enter passphrase..."
          value={passphrase}
          onChange={(e) => onPassphraseChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && passphrase) onDecrypt()
          }}
          aria-label="Decryption passphrase"
          type="password"
          fontSize="sm"
          fontFamily="mono"
          bg={inputBg}
          borderColor={yellowEncryptedBorder}
          color={inputText}
          h="44px"
          letterSpacing="0.15em"
          _placeholder={{ color: inputPlaceholder, letterSpacing: '0.02em' }}
          border="none"
          boxShadow={encryptedInputBoxShadow}
          _focus={{
            borderColor: yellowFocusBorder,
            boxShadow: `0 0 0 1px ${yellowFocusShadow}, 0 0 16px ${yellowFocusGlow}`,
          }}
        />
        <Button
          h="44px"
          px={6}
          fontSize="sm"
          fontWeight="800"
          letterSpacing="0.04em"
          textTransform="uppercase"
          bg={encryptedButtonBg}
          color={encryptedButtonColor}
          border="none"
          boxShadow={encryptedButtonBoxShadow}
          borderRadius={borderRadius.none}
          onClick={onDecrypt}
          isLoading={isDecrypting}
          loadingText="..."
          isDisabled={!passphrase}
          aria-label="Decrypt message with passphrase"
          _hover={{
            bg: yellowButtonHoverBg,
            transform: 'translateY(-1px)',
            boxShadow: yellowButtonHoverShadow,
          }}
          _active={{ transform: 'translateY(0)' }}
          _disabled={{
            opacity: 0.4,
            cursor: 'not-allowed',
            _hover: { bg: yellowButtonDisabledBg, transform: 'none', boxShadow: 'none' },
          }}
          transition="all 0.1s"
        >
          🗝️ Unlock
        </Button>
      </HStack>
      </Box>
    </Box>
  )
}
