import { Box, Button, HStack, Text, useColorModeValue } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { colors, borderRadius, getThemeValue } from '../config/themeTokens'
import { useThemeTextColor, useThemeBgColor, useAccentBgColor, useAccentShadow, useStatusColor, useAccentGradient } from '../shared/useThemeColors'

/* ── Animations ──────────────────────────────────────────────── */

const borderGlow = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`

const pulseRing = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  70% { transform: scale(2.2); opacity: 0; }
  100% { transform: scale(2.2); opacity: 0; }
`

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

/* ── Helpers ──────────────────────────────────────────────────── */

import { truncateAddress } from '../utils/formatting'

/** Derive a hue from an address for a unique accent color per wallet. */
function addressToHue(addr: string): number {
  let hash = 0
  for (let i = 2; i < addr.length; i++) {
    hash = addr.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

/* ── Inline SVG Icons ────────────────────────────────────────── */

function WalletIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
  )
}

function ChevronDownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function PowerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

/* ── Connected Button ────────────────────────────────────────── */

function ConnectedButton({
  address,
  onOpen,
}: {
  address: string
  onOpen: () => void
}) {
  const hue = addressToHue(address)
  const buttonBg = useThemeBgColor('overlay')
  const buttonBorder = useThemeBgColor('borderOverlay')
  const textColor = useThemeTextColor('primary')
  const chevronColor = useThemeTextColor('muted')
  const buttonShadow = `0 0 0 1px ${buttonBorder}`
  const buttonHoverBg = useThemeBgColor('overlayHover')
  const borderOverlayStrong = useThemeBgColor('borderOverlayStrong')
  const buttonHoverShadow = useColorModeValue(
    `0 0 0 1px ${borderOverlayStrong}, 0 4px 20px rgba(0,0,0,0.1), 0 0 20px hsla(${hue}, 70%, 50%, 0.08)`,
    `0 0 0 1px ${borderOverlayStrong}, 0 4px 20px rgba(0,0,0,0.3), 0 0 20px hsla(${hue}, 70%, 50%, 0.08)`
  )
  const buttonActiveBg = useThemeBgColor('overlayActive')
  const identiconBorder = useThemeBgColor('borderOverlaySubtle')
  const identiconShadow = useColorModeValue(
    `0 0 0 2px ${identiconBorder}`,
    `0 0 0 2px ${identiconBorder}`
  )
  const walletIconColor = useThemeBgColor('textOverlay')
  const statusDotBorder = useColorModeValue(
    getThemeValue(colors.bg.primary, 'light'),
    getThemeValue(colors.bg.primary, 'dark')
  )
  const statusDotColor = useStatusColor('success')
  const disconnectShadow = useColorModeValue(
    `0 0 0 1px ${identiconBorder}`,
    `0 0 0 1px ${identiconBorder}`
  )
  const disconnectHoverShadow = useAccentShadow('red', 'shadow')
  const disconnectActiveBg = useAccentBgColor('red', 'bgActive')
  const connectHoverShadow = disconnectHoverShadow
  const connectActiveBg = disconnectActiveBg

  return (
    <Button
      onClick={onOpen}
      variant="unstyled"
      display="flex"
      alignItems="center"
      h="40px"
      pl="6px"
      pr="10px"
      borderRadius={borderRadius.none}
      bg={buttonBg}
      border="none"
      boxShadow={buttonShadow}
      position="relative"
      overflow="hidden"
      transition="all 0.1s ease"
      _hover={{
        bg: buttonHoverBg,
        boxShadow: buttonHoverShadow,
        transform: 'translateY(-1px)',
      }}
      _active={{
        transform: 'translateY(0)',
        bg: buttonActiveBg,
      }}
    >
      <HStack spacing="8px">
        {/* Address identicon circle */}
        <Box position="relative">
          <Box
            w="28px"
            h="28px"
            borderRadius="full"
            bg={`linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 40) % 360}, 60%, 55%))`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="2px solid"
            borderColor={identiconBorder}
            boxShadow={identiconShadow}
          >
            <WalletIcon size={13} color={walletIconColor} />
          </Box>
          {/* Status dot with pulse ring */}
          <Box position="absolute" bottom="-1px" right="-1px">
            <Box position="relative">
              <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bg={statusDotColor}
                border="2px solid"
                borderColor={statusDotBorder}
                position="relative"
                zIndex={1}
              />
              <Box
                position="absolute"
                top="1px"
                left="1px"
                w="8px"
                h="8px"
                borderRadius="full"
                bg={statusDotColor}
                animation={`${pulseRing} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`}
              />
            </Box>
          </Box>
        </Box>

        {/* Address text */}
        <Text
          fontSize="13px"
          fontWeight="600"
          fontFamily="mono"
          color={textColor}
          letterSpacing="0.02em"
        >
          {truncateAddress(address)}
        </Text>

        {/* Chevron */}
        <Box color={chevronColor} ml="-2px">
          <ChevronDownIcon size={12} />
        </Box>
      </HStack>
    </Button>
  )
}

/* ── Disconnected Button (Header) ────────────────────────────── */

function DisconnectedButton({ onOpen }: { onOpen: () => void }) {
  const buttonBg = useThemeBgColor('primary')
  const hoverBg = useAccentBgColor('red', 'bgHover')
  const borderOverlaySubtle = useThemeBgColor('borderOverlaySubtle')
  const disconnectShadow = useColorModeValue(
    `0 0 0 1px ${borderOverlaySubtle}`,
    `0 0 0 1px ${borderOverlaySubtle}`
  )
  const disconnectHoverShadow = useAccentShadow('red', 'shadow')
  const disconnectActiveBg = useAccentBgColor('red', 'bgActive')
  const redGradient = useAccentBgColor('red', 'bgGradient')
  const orangeGradient = useAccentGradient('orange')
  const redBgButton = useAccentBgColor('red', 'bgButton')

  return (
    <Box position="relative">
      {/* Animated gradient border */}
      <Box
        position="absolute"
        inset="-1px"
        borderRadius={borderRadius.none}
        bg={`linear-gradient(135deg, ${redGradient}, ${orangeGradient}, ${redGradient})`}
        backgroundSize="200% 200%"
        animation={`${borderGlow} 3s ease-in-out infinite`}
        zIndex={0}
      />
      <Button
        onClick={onOpen}
        variant="unstyled"
        display="flex"
        alignItems="center"
        h="40px"
        px="10px"
        borderRadius={borderRadius.none}
        bg={buttonBg}
        position="relative"
        zIndex={1}
        transition="all 0.1s ease"
        _hover={{
          bg: hoverBg,
          transform: 'translateY(-1px)',
          boxShadow: disconnectHoverShadow,
        }}
        _active={{
          transform: 'translateY(0)',
          bg: disconnectActiveBg,
        }}
      >
        <HStack spacing="6px">
          <Box
            w="20px"
            h="20px"
            borderRadius="full"
            bg={redBgButton}
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={disconnectShadow}
          >
            <PowerIcon size={11} />
          </Box>
          <Text
            fontSize="13px"
            fontWeight="700"
            letterSpacing="0.03em"
            bgGradient="linear(to-r, red.300, orange.300)"
            bgClip="text"
          >
            Connect
          </Text>
        </HStack>
      </Button>
    </Box>
  )
}

/* ── Disconnected CTA (MessageComposer) ──────────────────────── */

function ConnectCTA({ onOpen }: { onOpen: () => void }) {
  const redGradientSubtle = useAccentBgColor('red', 'bgGradient')
  // Note: orange doesn't have gradientStrong, using regular gradient
  const orangeGradientSubtle = useAccentGradient('orange')
  const redGradientStrong = useAccentBgColor('red', 'bgGradientStrong')
  const redGradientCTA = useAccentBgColor('red', 'bgGradientCTA')
  const redShadowStrong = useAccentShadow('red', 'shadowStrong')
  const redShadowGlow = useAccentShadow('red', 'shadowGlow')
  const whiteOverlay = useThemeBgColor('whiteOverlay')
  const whiteOverlayStrong = useThemeBgColor('whiteOverlayStrong')

  return (
    <Box position="relative" display="inline-block">
      {/* Outer glow ring */}
      <Box
        position="absolute"
        inset="-2px"
        borderRadius={borderRadius.none}
        bg={`linear-gradient(135deg, ${redGradientSubtle}, ${orangeGradientSubtle}, ${redGradientSubtle})`}
        backgroundSize="200% 200%"
        animation={`${borderGlow} 3s ease-in-out infinite`}
        filter="blur(1px)"
        zIndex={0}
      />
      <Button
        onClick={onOpen}
        variant="unstyled"
        display="flex"
        alignItems="center"
        justifyContent="center"
        h="56px"
        px="32px"
        borderRadius={borderRadius.none}
        bg={`linear-gradient(135deg, ${redGradientStrong}, ${redGradientCTA})`}
        position="relative"
        zIndex={1}
        transition="all 0.1s ease"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 40px ${redShadowStrong}, 0 0 60px ${redShadowGlow}`,
        }}
        _active={{
          transform: 'translateY(0)',
          boxShadow: `0 2px 12px ${redShadowStrong}`,
        }}
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: borderRadius.none,
          bg: `linear-gradient(90deg, transparent 0%, ${whiteOverlay} 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: `${shimmer} 3s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      >
        <HStack spacing="10px">
          <WalletIcon size={20} color={whiteOverlayStrong} />
          <Text
            fontSize="15px"
            fontWeight="800"
            letterSpacing="0.06em"
            color="white"
          >
            Connect Wallet
          </Text>
        </HStack>
      </Button>
    </Box>
  )
}

/* ── Exported Composites ─────────────────────────────────────── */

/**
 * Compact wallet button for the header.
 * Shows connected state (identicon + address) or disconnected state (connect CTA).
 */
export function HeaderWalletButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()

  if (isConnected && address) {
    return <ConnectedButton address={address} onOpen={() => open()} />
  }

  return <DisconnectedButton onOpen={() => open()} />
}

/**
 * Large CTA button for the message composer disconnected state.
 */
export function ComposerConnectButton() {
  const { open } = useAppKit()
  return <ConnectCTA onOpen={() => open()} />
}
