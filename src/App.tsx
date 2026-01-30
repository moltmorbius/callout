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
    <Box minH="100vh" bg="#06060f" position="relative">
      <Header />

      <Container maxW="720px" py={10} px={5} position="relative" zIndex={1}>
        <VStack spacing={10} align="stretch">

          {/* Hero */}
          <Box textAlign="center" pt={4} pb={2} className="animate-fade-in">
            <Text
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight={800}
              letterSpacing="-0.03em"
              lineHeight={1.2}
              bgGradient="linear(to-r, gray.100, gray.300)"
              bgClip="text"
              mb={3}
            >
              Put scammers on blast.
              <br />
              On-chain. Forever.
            </Text>
            <Text
              color="gray.500"
              fontSize="sm"
              maxW="480px"
              mx="auto"
              lineHeight={1.7}
            >
              Encode messages as calldata and send them permanently to any EVM address.
              No backend. No censorship. Just the blockchain.
            </Text>
          </Box>

          {/* Tabs */}
          <Tabs variant="soft-rounded" colorScheme="red" isFitted>
            <TabList
              bg="rgba(255,255,255,0.03)"
              p="4px"
              borderRadius="14px"
              border="1px solid rgba(255,255,255,0.06)"
              gap={1}
              className="animate-fade-in animate-fade-in-delay-1"
            >
              <Tab
                borderRadius="11px"
                fontSize="sm"
                py="10px"
                fontWeight={600}
                color="gray.400"
                _selected={{
                  bg: 'red.600',
                  color: 'white',
                  boxShadow: '0 0 24px rgba(220, 38, 38, 0.3)',
                }}
                _hover={{ color: 'gray.200' }}
                transition="all 0.2s"
              >
                📡&nbsp;&nbsp;Send Callout
              </Tab>
              <Tab
                borderRadius="11px"
                fontSize="sm"
                py="10px"
                fontWeight={600}
                color="gray.400"
                _selected={{
                  bg: 'red.600',
                  color: 'white',
                  boxShadow: '0 0 24px rgba(220, 38, 38, 0.3)',
                }}
                _hover={{ color: 'gray.200' }}
                transition="all 0.2s"
              >
                🔓&nbsp;&nbsp;Decrypt
              </Tab>
            </TabList>

            <TabPanels mt={6}>
              <TabPanel px={0} className="animate-fade-in animate-fade-in-delay-2">
                <MessageComposer />
              </TabPanel>
              <TabPanel px={0} className="animate-fade-in animate-fade-in-delay-2">
                <DecryptMessage />
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Footer */}
          <Box
            textAlign="center"
            py={6}
            borderTop="1px solid rgba(255,255,255,0.04)"
          >
            <Text fontSize="xs" color="gray.600" letterSpacing="0.02em">
              Messages are encoded as UTF-8 hex in transaction calldata. Zero-value transfers.
            </Text>
            <Text fontSize="xs" color="gray.700" mt={1} letterSpacing="0.02em">
              All on-chain data is public and permanent. Act accordingly.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default App
