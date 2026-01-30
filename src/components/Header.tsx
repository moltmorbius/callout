import { Box, Flex, Heading, Text, HStack } from '@chakra-ui/react'

export function Header() {
  return (
    <Box
      position="sticky"
      top={0}
      zIndex={100}
      borderBottom="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      bg="rgba(6, 6, 15, 0.85)"
      backdropFilter="blur(16px)"
      px={6}
      py={3}
    >
      <Flex justify="space-between" align="center" maxW="720px" mx="auto">
        <HStack spacing={3}>
          <Box
            w="36px"
            h="36px"
            borderRadius="10px"
            bg="rgba(220, 38, 38, 0.12)"
            border="1px solid rgba(220, 38, 38, 0.25)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="lg"
            boxShadow="0 0 20px rgba(220, 38, 38, 0.15)"
          >
            📡
          </Box>
          <Box>
            <Heading
              size="sm"
              letterSpacing="-0.02em"
              fontWeight={700}
              color="gray.50"
            >
              Callout
            </Heading>
            <Text
              fontSize="10px"
              color="gray.500"
              letterSpacing="0.06em"
              textTransform="uppercase"
              fontWeight={500}
            >
              On-chain justice
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
