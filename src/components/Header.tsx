import { Box, Flex, Text, HStack, IconButton, useColorModeValue } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Icon } from '@iconify/react'
import { HeaderWalletButton } from './WalletButton'
import { colors as themeColors, boxShadows, gradients, borderRadius, spacing, getThemeValue } from '../config/themeTokens'
import { useColorModeWithSystem } from '../shared/useColorModeWithSystem'
import { useThemeBgColor, useAccentBgColor, useAccentBorderColor } from '../shared/useThemeColors'

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(220, 38, 38, 0.3); }
  50% { box-shadow: 0 0 16px rgba(220, 38, 38, 0.5), 0 0 30px rgba(220, 38, 38, 0.15); }
`

export function Header() {
  const { preference, setColorModePreference } = useColorModeWithSystem()
  const bgColor = useColorModeValue(
    getThemeValue(themeColors.bg.header, 'light'),
    getThemeValue(themeColors.bg.header, 'dark')
  )
  const borderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderDivider, 'light'),
    getThemeValue(boxShadows.borderDivider, 'dark')
  )
  const taglineColor = useColorModeValue(
    getThemeValue(themeColors.text.tagline, 'light'),
    getThemeValue(themeColors.text.tagline, 'dark')
  )
  const iconButtonShadow = useColorModeValue(
    getThemeValue(boxShadows.borderButton, 'light'),
    getThemeValue(boxShadows.borderButton, 'dark')
  )
  const buttonActiveBg = useAccentBgColor('purple', 'bgMeta')
  const buttonActiveBorder = useAccentBorderColor('purple', 'borderFocus')
  const buttonInactiveBg = useThemeBgColor('overlay')
  const buttonHoverBg = useThemeBgColor('overlayHover')
  const headerLogoGradient = useColorModeValue(
    getThemeValue(gradients.headerLogo, 'light'),
    getThemeValue(gradients.headerLogo, 'dark')
  )

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={100}
      borderBottom="none"
      boxShadow={borderShadow}
      bg={bgColor}
      backdropFilter="blur(20px)"
      px={{ base: spacing.containerPadding.base, md: spacing.containerPadding.md }}
      py={3}
    >
      <Flex justify="space-between" align="center" maxW="960px" mx="auto">
        <HStack spacing={3} align="center" minW={0} flex={1}>
          {/* Crosshair icon with pulse */}
          <Box
            w="40px"
            h="40px"
            borderRadius={borderRadius.none}
            bg={themeColors.accent.red.bg}
            border="none"
            boxShadow={`0 0 0 1px ${themeColors.accent.red.borderStrong}`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            animation={`${pulseGlow} 3s ease-in-out infinite`}
          >
            <Text fontSize="xl" lineHeight="1">
              ⊕
            </Text>
          </Box>
          <Box>
            <Text
              fontSize="xl"
              fontWeight="900"
              letterSpacing="0.18em"
              textTransform="uppercase"
              bgGradient={headerLogoGradient}
              bgClip="text"
              lineHeight="1.2"
            >
              Callout
            </Text>
            <Text
              fontSize="9px"
              color={taglineColor}
              letterSpacing="0.25em"
              textTransform="uppercase"
              fontWeight="600"
            >
              On-Chain Justice
            </Text>
          </Box>
        </HStack>
        <HStack spacing={2} flexShrink={0}>
          <HStack spacing={0}>
            <IconButton
              aria-label="Light mode"
              icon={<Icon icon="mdi:weather-sunny" width="16px" height="16px" />}
              onClick={() => setColorModePreference('light')}
              variant="ghost"
              size="sm"
              borderRadius={borderRadius.none}
              bg={preference === 'light' ? buttonActiveBg : buttonInactiveBg}
              boxShadow={preference === 'light' ? `0 0 0 1px ${buttonActiveBorder}` : iconButtonShadow}
              _hover={{
                bg: preference === 'light' ? buttonActiveBg : buttonHoverBg,
              }}
            />
            <IconButton
              aria-label="System mode"
              icon={<Icon icon="mdi:monitor" width="16px" height="16px" />}
              onClick={() => setColorModePreference('system')}
              variant="ghost"
              size="sm"
              borderRadius={borderRadius.none}
              bg={preference === 'system' ? buttonActiveBg : buttonInactiveBg}
              boxShadow={preference === 'system' ? `0 0 0 1px ${buttonActiveBorder}` : iconButtonShadow}
              ml="1px"
              _hover={{
                bg: preference === 'system' ? buttonActiveBg : buttonHoverBg,
              }}
            />
            <IconButton
              aria-label="Dark mode"
              icon={<Icon icon="mdi:weather-night" width="16px" height="16px" />}
              onClick={() => setColorModePreference('dark')}
              variant="ghost"
              size="sm"
              borderRadius={borderRadius.none}
              bg={preference === 'dark' ? buttonActiveBg : buttonInactiveBg}
              boxShadow={preference === 'dark' ? `0 0 0 1px ${buttonActiveBorder}` : iconButtonShadow}
              ml="1px"
              _hover={{
                bg: preference === 'dark' ? buttonActiveBg : buttonHoverBg,
              }}
            />
          </HStack>
          <HeaderWalletButton />
        </HStack>
      </Flex>
    </Box>
  )
}
