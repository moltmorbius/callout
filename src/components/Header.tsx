import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(220, 38, 38, 0.3); }
  50% { box-shadow: 0 0 16px rgba(220, 38, 38, 0.5), 0 0 30px rgba(220, 38, 38, 0.15); }
`

export function Header() {
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
        <HStack spacing={3} align="center">
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
        <Box>
          <appkit-button />
        </Box>
      </Flex>
    </Box>
  )
}
