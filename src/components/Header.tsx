import { Box, Flex, Text, HStack, Button } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(220, 38, 38, 0.3); }
  50% { box-shadow: 0 0 16px rgba(220, 38, 38, 0.5), 0 0 30px rgba(220, 38, 38, 0.15); }
`

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function Header() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={100}
      borderBottom="1px solid"
      borderColor="whiteAlpha.50"
      bg="rgba(6, 6, 15, 0.85)"
      backdropFilter="blur(20px)"
      px={{ base: 4, md: 6 }}
      py={3}
    >
      <Flex justify="space-between" align="center" maxW="960px" mx="auto">
        <HStack spacing={3} align="center" minW={0} flex={1}>
          {/* Crosshair icon with pulse */}
          <Box
            w="40px"
            h="40px"
            borderRadius="lg"
            bg="rgba(220, 38, 38, 0.15)"
            border="1px solid"
            borderColor="rgba(220, 38, 38, 0.35)"
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
              bgGradient="linear(to-r, red.400, red.300, orange.300)"
              bgClip="text"
              lineHeight="1.2"
            >
              Callout
            </Text>
            <Text
              fontSize="9px"
              color="whiteAlpha.350"
              letterSpacing="0.25em"
              textTransform="uppercase"
              fontWeight="600"
            >
              On-Chain Justice
            </Text>
          </Box>
        </HStack>
        <Box flexShrink={0}>
          <Button
            size="sm"
            px={4}
            fontWeight="700"
            fontSize="xs"
            letterSpacing="0.04em"
            fontFamily={isConnected ? 'mono' : 'body'}
            bg={isConnected ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.85)'}
            color={isConnected ? 'red.300' : 'white'}
            border="1px solid"
            borderColor={isConnected ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.6)'}
            borderRadius="lg"
            _hover={{
              bg: isConnected ? 'rgba(220, 38, 38, 0.2)' : 'red.600',
              borderColor: 'rgba(220, 38, 38, 0.5)',
            }}
            _active={{ bg: isConnected ? 'rgba(220, 38, 38, 0.25)' : 'red.700' }}
            onClick={() => open()}
          >
            {isConnected && address ? truncateAddress(address) : 'Connect Wallet'}
          </Button>
        </Box>
      </Flex>
    </Box>
  )
}
