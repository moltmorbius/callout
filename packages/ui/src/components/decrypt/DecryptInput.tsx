import { Box, HStack, Text, Badge, Select } from '@chakra-ui/react'
import { useCardStyle } from '../../shared/styles'
import { ThemedTextarea } from '../../shared/ThemedTextarea'
import { borderRadius, boxShadows, getThemeValue } from '../../config/themeTokens'
import { useThemeTextColor, useThemeBgColor, useAccentBorderColor, useAccentTextColor, useAccentGradient, useBlueBadgeColors, usePurpleBadgeColors, useBlueIconColors } from '../../shared/useThemeColors'
import { useColorModeValue } from '@chakra-ui/react'
import { CHAIN_INFO } from '@callout/shared/types'

interface DecryptInputProps {
  inputValue: string
  onInputChange: (value: string) => void
  inputIsTxHash: boolean
  chainId?: string
  onChainIdChange?: (chainId: string) => void
}

/**
 * Input section for decrypt tab.
 * Displays header, input type badge, and textarea for transaction hash or calldata.
 * When input is a transaction hash, shows chain ID selector.
 */
export function DecryptInput({ inputValue, onInputChange, inputIsTxHash, chainId, onChainIdChange }: DecryptInputProps) {
  const cardStyleContainer = useCardStyle(false)
  const textMuted = useThemeTextColor('muted')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const inputBg = useThemeBgColor('input')

  const blueBorderMeta = useAccentBorderColor('blue', 'borderMeta')
  const inputBoxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderAccent, 'light'),
    `0 0 0 1px ${blueBorderMeta}`
  )
  const boxShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const blueIcon = useBlueIconColors()
  const blueBadge = useBlueBadgeColors()
  const blueTextLight = useAccentTextColor('blueLight')
  const purpleBadge = usePurpleBadgeColors()
  const blueGradient = useAccentGradient('blue')

  return (
    <Box
      {...cardStyleContainer}
      boxShadow={inputBoxShadow}
      position="relative"
      overflow="hidden"
      px={4}
      py={3}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        bgGradient: `linear(to-r, transparent, ${blueGradient}, transparent)`,
      }}
    >
      <HStack spacing={3} mb={2}>
        <Box
          w="32px"
          h="32px"
          borderRadius={borderRadius.none}
          bg={blueIcon.bg}
          border="1px solid"
          borderColor={blueIcon.borderColor}
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
            color={blueTextLight}
          >
            Decode Calldata
          </Text>
          <Text fontSize="xs" color={textMuted} mt={0.5}>
            Paste a transaction hash or raw hex calldata
          </Text>
        </Box>
        {inputValue.trim() && (
          <Badge
            fontSize="9px"
            fontWeight="700"
            letterSpacing="0.05em"
            borderRadius={borderRadius.none}
            px={2}
            py={0.5}
            bg={inputIsTxHash ? purpleBadge.bg : blueBadge.bg}
            color={inputIsTxHash ? purpleBadge.text : blueBadge.text}
            border="1px solid"
            borderColor={inputIsTxHash ? purpleBadge.borderColor : blueBadge.borderColor}
            ml="auto"
          >
            {inputIsTxHash ? '🔗 Transaction Hash' : '📦 Raw Calldata'}
          </Badge>
        )}
      </HStack>

      {inputValue.trim() && (
        <HStack mb={2} spacing={2} flexWrap="wrap">
          {inputIsTxHash && (
            <>
              <Text fontSize="10px" color={textMuted}>
                Will fetch from blockchain RPC
              </Text>
              {onChainIdChange && (
                <HStack spacing={2} ml="auto">
                  <Text fontSize="10px" color={textVeryMuted}>
                    Chain:
                  </Text>
                  <Select
                    value={chainId || '1'}
                    onChange={(e) => onChainIdChange(e.target.value)}
                    size="xs"
                    bg={inputBg}
                    border="none"
                    boxShadow={boxShadow}
                    borderRadius={borderRadius.none}
                    fontSize="10px"
                    w="140px"
                  >
                    {Object.entries(CHAIN_INFO).map(([id, info]) => (
                      <option key={id} value={id}>
                        {info.name} ({id})
                      </option>
                    ))}
                  </Select>
                </HStack>
              )}
            </>
          )}
        </HStack>
      )}

      <ThemedTextarea
        placeholder="0x5c504ed432cb51... (tx hash) or 0x48656c6c6f... (calldata)"
        value={inputValue}
        onChange={(e) => onInputChange((e.currentTarget as HTMLDivElement & { value: string }).value)}
        aria-label="Transaction hash or hex calldata input"
        size="sm"
        monospace
        rows={4}
        mb={0}
        accentColor="blue"
      />
    </Box>
  )
}
