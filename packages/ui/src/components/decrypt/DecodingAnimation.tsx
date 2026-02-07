import { Box, HStack, Text, Collapse, useColorModeValue } from '@chakra-ui/react'
import { borderRadius } from '../../config/themeTokens'
import { useThemeBgColor, useThemeTextColor, useAccentBorderColor, useAccentSpecialColor, useAccentTextColor } from '../../shared/useThemeColors'
import { scanLine, glowPulse } from './animations'
import { useScrambleText } from './useScrambleText'

interface DecodingAnimationProps {
  isDecoding: boolean
  decodedMessage: string | null
  inputIsTxHash: boolean
}

/**
 * Decoding animation component with scramble effect.
 * Shows animated scramble text while decoding is in progress.
 */
export function DecodingAnimation({ isDecoding, decodedMessage, inputIsTxHash }: DecodingAnimationProps) {
  const cardBg = useThemeBgColor('card')
  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')

  const blueBorder = useAccentBorderColor('blue', 'border')
  const decodingBoxShadow = `0 0 0 1px ${blueBorder}`
  const blueScanBg = useAccentSpecialColor('blue', 'scanBg')
  const blueScanShadow = useAccentSpecialColor('blue', 'scanShadow')
  const blueShadowFocus = useAccentSpecialColor('blue', 'shadowFocus')
  const decodingTextShadow = `0 0 0 1px ${blueShadowFocus}`
  const blueTextLight = useAccentTextColor('blueLight')
  const scrambled = useScrambleText(decodedMessage, isDecoding, 900)

  return (
    <Collapse in={isDecoding} animateOpacity>
      {isDecoding && (
        <Box
          bg={cardBg}
          borderRadius={borderRadius.none}
          border="none"
          boxShadow={decodingBoxShadow}
          position="relative"
          overflow="hidden"
          px={4}
          py={3}
          animation={`${glowPulse} 3s ease-in-out infinite`}
        >
          <Box
            position="absolute"
            left={0}
            right={0}
            height="2px"
            bg={blueScanBg}
            boxShadow={`0 0 12px ${blueScanShadow}`}
            animation={`${scanLine} 1s linear infinite`}
            zIndex={2}
          />
          <HStack spacing={2} mb={2}>
            <Text fontSize="md">⚡</Text>
            <Text
              fontSize="xs"
              fontWeight="800"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color={blueTextLight}
            >
              {inputIsTxHash ? 'Fetching & Decoding...' : 'Decoding...'}
            </Text>
          </HStack>
          <Box
            bg={inputBg}
            p={3}
            borderRadius={borderRadius.none}
            border="none"
            boxShadow={decodingTextShadow}
            fontFamily="mono"
            fontSize="sm"
            color={inputText}
            whiteSpace="pre-wrap"
            lineHeight="1.7"
            opacity={0.8}
          >
            {scrambled || '...'}
          </Box>
        </Box>
      )}
    </Collapse>
  )
}
