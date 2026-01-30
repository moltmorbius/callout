import { Box, Flex, Text, HStack } from '@chakra-ui/react'

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
          {/* Crosshair icon */}
          <Box
            w="36px"
            h="36px"
            borderRadius="lg"
            bg="rgba(220, 38, 38, 0.15)"
            border="1px solid"
            borderColor="rgba(220, 38, 38, 0.3)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Text fontSize="lg" lineHeight="1">
              ⊕
            </Text>
          </Box>
          <Box>
            <Text
              fontSize="lg"
              fontWeight="900"
              letterSpacing="0.15em"
              textTransform="uppercase"
              bgGradient="linear(to-r, red.400, red.300, orange.300)"
              bgClip="text"
              lineHeight="1.2"
            >
              Callout
            </Text>
            <Text
              fontSize="10px"
              color="whiteAlpha.400"
              letterSpacing="0.2em"
              textTransform="uppercase"
              fontWeight="500"
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
