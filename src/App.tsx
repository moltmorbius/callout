import { lazy, Suspense } from 'react'
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
  Spinner,
  Center,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Header } from './components/Header'
import { MessageComposer } from './components/MessageComposer'

const DecryptMessage = lazy(() =>
  import('./components/DecryptMessage').then((m) => ({ default: m.DecryptMessage }))
)

const subtlePulse = keyframes`
  0%, 100% { opacity: 0.07; }
  50% { opacity: 0.12; }
`

function App() {
  return (
    <Box minH="100vh" bg="#06060f" position="relative">
      {/* Subtle background gradient */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        height="700px"
        bgGradient="radial(ellipse at 50% -20%, rgba(220,38,38,0.08) 0%, transparent 70%)"
        pointerEvents="none"
        zIndex={0}
        animation={`${subtlePulse} 8s ease-in-out infinite`}
      />
      {/* Secondary ambient glow */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        height="400px"
        bgGradient="radial(ellipse at 50% 120%, rgba(99,179,237,0.03) 0%, transparent 70%)"
        pointerEvents="none"
        zIndex={0}
      />

      <Box position="relative" zIndex={1}>
        <Header />

        <Container maxW="720px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            {/* Hero */}
            <Box textAlign="center" pt={{ base: 6, md: 10 }} pb={{ base: 2, md: 4 }}>
              {/* Big CALLOUT wordmark */}
              <Text
                fontSize={{ base: '4xl', md: '6xl' }}
                fontWeight="900"
                letterSpacing={{ base: '0.12em', md: '0.18em' }}
                textTransform="uppercase"
                bgGradient="linear(to-r, red.500, red.400, orange.400, red.400)"
                bgClip="text"
                lineHeight="1"
                mb={4}
              >
                Callout
              </Text>

              <Text
                fontSize={{ base: 'lg', md: '2xl' }}
                fontWeight="800"
                letterSpacing="-0.01em"
                lineHeight="1.3"
                mb={4}
                color="whiteAlpha.800"
              >
                Put scammers on blast.{' '}
                <Box
                  as="span"
                  bgGradient="linear(to-r, red.400, orange.300)"
                  bgClip="text"
                >
                  On-chain. Forever.
                </Box>
              </Text>
              <Text
                color="whiteAlpha.350"
                fontSize={{ base: 'sm', md: 'md' }}
                maxW="480px"
                mx="auto"
                lineHeight="1.7"
              >
                Encode messages as calldata and send them permanently to any EVM address.
                No backend. No censorship. Just the blockchain.
              </Text>
            </Box>

            {/* Tabs */}
            <Tabs variant="unstyled" isFitted>
              <TabList
                bg="rgba(14, 14, 30, 0.5)"
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
                  color="whiteAlpha.400"
                  py={2.5}
                  transition="all 0.2s"
                  _selected={{
                    bg: 'rgba(220, 38, 38, 0.12)',
                    color: 'red.300',
                    border: '1px solid',
                    borderColor: 'rgba(220, 38, 38, 0.25)',
                  }}
                  _hover={{
                    color: 'whiteAlpha.700',
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
                  color="whiteAlpha.400"
                  py={2.5}
                  transition="all 0.2s"
                  _selected={{
                    bg: 'rgba(99, 179, 237, 0.1)',
                    color: 'blue.300',
                    border: '1px solid',
                    borderColor: 'rgba(99, 179, 237, 0.25)',
                  }}
                  _hover={{
                    color: 'whiteAlpha.700',
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
                  <Suspense
                    fallback={
                      <Center py={12}>
                        <Spinner color="blue.300" size="lg" />
                      </Center>
                    }
                  >
                    <DecryptMessage />
                  </Suspense>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Footer */}
            <Box
              textAlign="center"
              py={8}
              mt={4}
              borderTop="1px solid"
              borderColor="whiteAlpha.50"
            >
              <Flex
                justify="center"
                align="center"
                gap={2}
                mb={3}
              >
                <Box
                  w="22px"
                  h="22px"
                  borderRadius="md"
                  bg="rgba(220, 38, 38, 0.1)"
                  border="1px solid"
                  borderColor="rgba(220, 38, 38, 0.2)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="10px"
                >
                  ⊕
                </Box>
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
