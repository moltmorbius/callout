import { Box, Button, HStack, Text } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

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

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

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

  return (
    <Button
      onClick={onOpen}
      variant="unstyled"
      display="flex"
      alignItems="center"
      h="40px"
      pl="6px"
      pr="10px"
      borderRadius="xl"
      bg="rgba(255,255,255,0.04)"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      position="relative"
      overflow="hidden"
      transition="all 0.2s ease"
      _hover={{
        bg: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.14)',
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 20px hsla(${hue}, 70%, 50%, 0.08)`,
      }}
      _active={{
        transform: 'translateY(0)',
        bg: 'rgba(255,255,255,0.05)',
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
            borderColor="rgba(255,255,255,0.1)"
          >
            <WalletIcon size={13} color="rgba(255,255,255,0.9)" />
          </Box>
          {/* Status dot with pulse ring */}
          <Box position="absolute" bottom="-1px" right="-1px">
            <Box position="relative">
              <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bg="#22c55e"
                border="2px solid"
                borderColor="#06060f"
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
                bg="#22c55e"
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
          color="whiteAlpha.800"
          letterSpacing="0.02em"
        >
          {truncateAddress(address)}
        </Text>

        {/* Chevron */}
        <Box color="whiteAlpha.300" ml="-2px">
          <ChevronDownIcon size={12} />
        </Box>
      </HStack>
    </Button>
  )
}

/* ── Disconnected Button (Header) ────────────────────────────── */

function DisconnectedButton({ onOpen }: { onOpen: () => void }) {
  return (
    <Box position="relative">
      {/* Animated gradient border */}
      <Box
        position="absolute"
        inset="-1px"
        borderRadius="xl"
        bg="linear-gradient(135deg, rgba(220,38,38,0.6), rgba(251,146,60,0.4), rgba(220,38,38,0.6))"
        backgroundSize="200% 200%"
        animation={`${borderGlow} 2s ease-in-out infinite`}
        zIndex={0}
      />
      <Button
        onClick={onOpen}
        variant="unstyled"
        display="flex"
        alignItems="center"
        h="40px"
        px="16px"
        borderRadius="xl"
        bg="#06060f"
        position="relative"
        zIndex={1}
        transition="all 0.25s ease"
        _hover={{
          bg: 'rgba(220,38,38,0.12)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 24px rgba(220,38,38,0.25)',
        }}
        _active={{
          transform: 'translateY(0)',
          bg: 'rgba(220,38,38,0.18)',
        }}
      >
        <HStack spacing="8px">
          <Box
            w="24px"
            h="24px"
            borderRadius="lg"
            bg="rgba(220,38,38,0.15)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <PowerIcon size={13} />
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
  return (
    <Box position="relative" display="inline-block">
      {/* Outer glow ring */}
      <Box
        position="absolute"
        inset="-2px"
        borderRadius="2xl"
        bg="linear-gradient(135deg, rgba(220,38,38,0.5), rgba(251,146,60,0.3), rgba(220,38,38,0.5))"
        backgroundSize="200% 200%"
        animation={`${borderGlow} 2.5s ease-in-out infinite`}
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
        borderRadius="2xl"
        bg="linear-gradient(135deg, rgba(220,38,38,0.9), rgba(185,28,28,0.95))"
        position="relative"
        zIndex={1}
        transition="all 0.25s ease"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 40px rgba(220,38,38,0.35), 0 0 60px rgba(220,38,38,0.12)',
        }}
        _active={{
          transform: 'translateY(0)',
          boxShadow: '0 2px 12px rgba(220,38,38,0.2)',
        }}
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '2xl',
          bg: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: `${shimmer} 3s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      >
        <HStack spacing="10px">
          <WalletIcon size={20} color="rgba(255,255,255,0.95)" />
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
