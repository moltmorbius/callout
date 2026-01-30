import {
  Box,
  Container,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Header } from './components/Header'
import { MessageComposer } from './components/MessageComposer'
import { DecryptMessage } from './components/DecryptMessage'

function App() {
  return (
    <Box minH="100vh" bg="#0a0a1a">
      <Header />
      <Container maxW="900px" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Tagline */}
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="gray.100" mb={2}>
              Put scammers on blast. On-chain. Forever.
            </Text>
            <Text color="gray.500" fontSize="sm">
              Send messages directly to any address via transaction calldata.
              Permanent. Immutable. Unstoppable.
            </Text>
          </Box>

          {/* Tabs */}
          <Tabs variant="soft-rounded" colorScheme="red" isFitted>
            <TabList
              bg="whiteAlpha.50"
              p={1}
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              <Tab
                _selected={{ bg: 'red.600', color: 'white' }}
                borderRadius="lg"
                fontWeight="semibold"
              >
                <Text mr={2}>📡</Text> Send Message
              </Tab>
              <Tab
                _selected={{ bg: 'red.600', color: 'white' }}
                borderRadius="lg"
                fontWeight="semibold"
              >
                <Text mr={2}>🔓</Text> Decrypt Message
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <MessageComposer />
              </TabPanel>
              <TabPanel px={0}>
                <DecryptMessage />
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Footer */}
          <Box textAlign="center" py={4} borderTop="1px solid" borderColor="whiteAlpha.100">
            <Text fontSize="xs" color="gray.600">
              Messages are encoded as UTF-8 hex in transaction input data. Zero-value transfers only.
            </Text>
            <Text fontSize="xs" color="gray.700" mt={1}>
              All on-chain data is public and permanent.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default App
