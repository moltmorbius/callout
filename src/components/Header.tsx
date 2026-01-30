import { Box, Flex, Heading, Text, HStack } from '@chakra-ui/react'

export function Header() {
  return (
    <Box
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      bg="blackAlpha.500"
      px={6}
      py={4}
    >
      <Flex justify="space-between" align="center" maxW="900px" mx="auto">
        <HStack spacing={3}>
          <Text fontSize="2xl">📡</Text>
          <Box>
            <Heading size="md" letterSpacing="tight">
              Callout
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Put scammers on blast. On-chain. Forever.
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
