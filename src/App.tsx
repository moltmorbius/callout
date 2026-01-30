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
  HStack,
  Flex,
} from '@chakra-ui/react'
import { Header } from './components/Header'
import { MessageComposer } from './components/MessageComposer'
import { DecryptMessage } from './components/DecryptMessage'

function App() {
  return (
    <Box minH="100vh" bg="#06060f" position="relative">
      {/* Subtle background gradient */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="radial(ellipse at 50% 0%, rgba(220,38,38,0.06) 0%, transparent 60%)"
        pointerEvents="none"
        zIndex={0}
      />

      <Box position="relative" zIndex={1}>
        <Header />

        <Container maxW="720px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
          <VStack spacing={{ base: 6, md: 10 }} align="stretch">
            {/* Hero */}
            <Box textAlign="center" pt={{ base: 2, md: 4 }} pb={{ base: 0, md: 2 }}>
              <Text
                fontSize={{ base: '2xl', md: '4xl' }}
                fontWeight="900"
                letterSpacing="-0.02em"
                lineHeight="1.1"
                mb={3}
              >
                Put scammers on blast.{' '}
                <Box
                  as="span"
                  bgGradient="linear(to-r, red.400, orange.400)"
                  bgClip="text"
                >
                  On-chain. Forever.
                </Box>
              </Text>
              <Text
                color="whiteAlpha.500"
                fontSize={{ base: 'sm', md: 'md' }}
                maxW="500px"
                mx="auto"
                lineHeight="1.6"
              >
                Encode messages as calldata and send them permanently to any EVM address.
                No backend. No censorship. Just the blockchain.
              </Text>
            </Box>

            {/* Tabs */}
            <Tabs variant="unstyled" isFitted>
              <TabList
                bg="rgba(20, 20, 43, 0.5)"
                p="4px"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.50"
              >
                <Tab
                  borderRadius="lg"
                  fontWeight="700"
                  fontSize="sm"
                  letterSpacing="0.02em"
                  color="whiteAlpha.500"
                  py={2.5}
                  transition="all 0.2s"
                  _selected={{
                    bg: 'rgba(220, 38, 38, 0.15)',
                    color: 'red.300',
                    border: '1px solid',
                    borderColor: 'rgba(220, 38, 38, 0.3)',
                  }}
                  _hover={{
                    color: 'whiteAlpha.800',
                  }}
                >
                  <HStack spacing={2}>
                    <Text fontSize="sm">📡</Text>
                    <Text>Send Callout</Text>
                  </HStack>
                </Tab>
                <Tab
                  borderRadius="lg"
                  fontWeight="700"
                  fontSize="sm"
                  letterSpacing="0.02em"
                  color="whiteAlpha.500"
                  py={2.5}
                  transition="all 0.2s"
                  _selected={{
                    bg: 'rgba(99, 179, 237, 0.1)',
                    color: 'blue.300',
                    border: '1px solid',
                    borderColor: 'rgba(99, 179, 237, 0.25)',
                  }}
                  _hover={{
                    color: 'whiteAlpha.800',
                  }}
                >
                  <HStack spacing={2}>
                    <Text fontSize="sm">🔓</Text>
                    <Text>Decrypt</Text>
                  </HStack>
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0} pt={6}>
                  <MessageComposer />
                </TabPanel>
                <TabPanel px={0} pt={6}>
                  <DecryptMessage />
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Footer */}
            <Box
              textAlign="center"
              py={6}
              mt={4}
              borderTop="1px solid"
              borderColor="whiteAlpha.50"
            >
              <Flex
                justify="center"
                align="center"
                gap={2}
                mb={2}
              >
                <Text fontSize="10px" color="whiteAlpha.200" letterSpacing="0.15em" textTransform="uppercase">
                  ⊕
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="800"
                  letterSpacing="0.15em"
                  textTransform="uppercase"
                  color="whiteAlpha.300"
                >
                  callout.city
                </Text>
              </Flex>
              <Text fontSize="xs" color="whiteAlpha.200" lineHeight="1.8">
                Messages are encoded as UTF-8 hex in transaction calldata. Zero-value transfers only.
              </Text>
              <Text fontSize="xs" color="whiteAlpha.100" mt={0.5}>
                All on-chain data is public and permanent. Act accordingly.
              </Text>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

export default App
