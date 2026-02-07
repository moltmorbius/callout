import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
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
  Spinner,
  Center,
  useColorModeValue,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { MessageComposer } from './components/MessageComposer'
import { colors, boxShadows, gradients, getThemeValue } from './config/themeTokens'
import { useAccentTextColor } from './shared/useThemeColors'

const TAB_STORAGE_KEY = 'callout-tab-state'

const DecryptMessage = lazy(() =>
  import('./components/DecryptMessage').then((m) => ({ default: m.DecryptMessage }))
)
const MessageFeed = lazy(() =>
  import('./components/MessageFeed').then((m) => ({ default: m.MessageFeed }))
)
const BatchSigner = lazy(() =>
  import('./components/BatchSigner').then((m) => ({ default: m.BatchSigner }))
)
const TransactionParser = lazy(() =>
  import('./components/TransactionParser').then((m) => ({ default: m.TransactionParser }))
)

const subtlePulse = keyframes`
  0%, 100% { opacity: 0.07; }
  50% { opacity: 0.12; }
`

function App() {
  const orangeTabSelectedBg = useColorModeValue('rgba(237, 137, 54, 0.1)', 'rgba(237, 137, 54, 0.1)')
  const orangeTabSelectedColor = useAccentTextColor('orange')
  const blueSpinnerColor = useAccentTextColor('blueLight')
  const greenSpinnerColor = useAccentTextColor('greenLight')
  const purpleSpinnerColor = useAccentTextColor('purpleLight')
  const orangeSpinnerColor = useAccentTextColor('orangeLight')

  // Tab selected colors with light/dark variants
  const redTabSelectedBg = useColorModeValue(
    getThemeValue(colors.bg.tabSelected.red, 'light'),
    getThemeValue(colors.bg.tabSelected.red, 'dark')
  )
  const redTabSelectedColor = useColorModeValue(
    getThemeValue(colors.text.tabSelected.red, 'light'),
    getThemeValue(colors.text.tabSelected.red, 'dark')
  )
  const blueTabSelectedBg = useColorModeValue(
    getThemeValue(colors.bg.tabSelected.blue, 'light'),
    getThemeValue(colors.bg.tabSelected.blue, 'dark')
  )
  const blueTabSelectedColor = useColorModeValue(
    getThemeValue(colors.text.tabSelected.blue, 'light'),
    getThemeValue(colors.text.tabSelected.blue, 'dark')
  )
  const greenTabSelectedBg = useColorModeValue(
    getThemeValue(colors.bg.tabSelected.green, 'light'),
    getThemeValue(colors.bg.tabSelected.green, 'dark')
  )
  const greenTabSelectedColor = useColorModeValue(
    getThemeValue(colors.text.tabSelected.green, 'light'),
    getThemeValue(colors.text.tabSelected.green, 'dark')
  )
  const purpleTabSelectedBg = useColorModeValue(
    getThemeValue(colors.bg.tabSelected.purple, 'light'),
    getThemeValue(colors.bg.tabSelected.purple, 'dark')
  )
  const purpleTabSelectedColor = useColorModeValue(
    getThemeValue(colors.text.tabSelected.purple, 'light'),
    getThemeValue(colors.text.tabSelected.purple, 'dark')
  )
  const heroGradient = useColorModeValue(
    getThemeValue(gradients.hero, 'light'),
    getThemeValue(gradients.hero, 'dark')
  )
  const heroAccentGradient = useColorModeValue(
    getThemeValue(gradients.heroAccent, 'light'),
    getThemeValue(gradients.heroAccent, 'dark')
  )

  // ── Load saved tab index from localStorage ──────────────────────────
  const loadSavedTabIndex = useCallback(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY)
      if (!saved) return 0
      const index = parseInt(saved, 10)
      // Ensure index is valid (0-4 for our 5 tabs)
      return index >= 0 && index <= 4 ? index : 0
    } catch {
      return 0
    }
  }, [])

  // ── Tab state ────────────────────────────────────────────────────────
  const [tabIndex, setTabIndex] = useState(() => loadSavedTabIndex())

  // ── Save tab index to localStorage ──────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, String(tabIndex))
    } catch {
      // Ignore localStorage errors
    }
  }, [tabIndex])

  // Theme-aware colors from centralized tokens
  const bgColor = useColorModeValue(
    getThemeValue(colors.bg.primary, 'light'),
    getThemeValue(colors.bg.primary, 'dark')
  )
  const topGradient = useColorModeValue(
    getThemeValue(gradients.backgroundTop, 'light'),
    getThemeValue(gradients.backgroundTop, 'dark')
  )
  const bottomGradient = useColorModeValue(
    getThemeValue(gradients.backgroundBottom, 'light'),
    getThemeValue(gradients.backgroundBottom, 'dark')
  )
  const tabListBg = useColorModeValue(
    getThemeValue(colors.bg.tabList, 'light'),
    getThemeValue(colors.bg.tabList, 'dark')
  )
  const tabListBorder = useColorModeValue(
    getThemeValue(boxShadows.borderTabList, 'light'),
    getThemeValue(boxShadows.borderTabList, 'dark')
  )
  const tabColor = useColorModeValue(
    getThemeValue(colors.text.tab, 'light'),
    getThemeValue(colors.text.tab, 'dark')
  )
  const tabHoverColor = useColorModeValue(
    getThemeValue(colors.text.tabHover, 'light'),
    getThemeValue(colors.text.tabHover, 'dark')
  )
  const heroSubtext = useColorModeValue(
    getThemeValue(colors.text.heroSubtext, 'light'),
    getThemeValue(colors.text.heroSubtext, 'dark')
  )
  const heroText = useColorModeValue(
    getThemeValue(colors.text.hero, 'light'),
    getThemeValue(colors.text.hero, 'dark')
  )

  return (
    <Box minH="100vh" bg={bgColor} position="relative">
      {/* Subtle background gradient */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        height="700px"
        bgGradient={topGradient}
        pointerEvents="none"
        zIndex={0}
        animation={`${subtlePulse} 3s ease-in-out infinite`}
      />
      {/* Secondary ambient glow */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        height="400px"
        bgGradient={bottomGradient}
        pointerEvents="none"
        zIndex={0}
      />

      <Box position="relative" zIndex={1}>
        <Header />

        <Container maxW="720px" px={0} py={{ base: 6, md: 10 }}>
          <VStack spacing={0} align="stretch">
            {/* Hero */}
            <Box textAlign="center" pt={{ base: 6, md: 10 }} pb={8}>
              {/* Big CALLOUT wordmark */}
              <Text
                fontSize={{ base: '4xl', md: '6xl' }}
                fontWeight="900"
                letterSpacing={{ base: '0.12em', md: '0.18em' }}
                textTransform="uppercase"
                bgGradient={heroGradient}
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
                color={heroText}
              >
                Send permanent messages.{' '}
                <Box
                  as="span"
                  bgGradient={heroAccentGradient}
                  bgClip="text"
                >
                  On-chain. Forever.
                </Box>
              </Text>
              <Text
                color={heroSubtext}
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
            <Tabs variant="unstyled" isFitted index={tabIndex} onChange={setTabIndex}>
              <TabList
                bg={tabListBg}
                p={0}
                borderRadius={0}
                border="none"
                boxShadow={tabListBorder}
              >
                <Tab
                  borderRadius={0}
                  fontWeight="700"
                  fontSize="sm"
                  letterSpacing="0.02em"
                  color={tabColor}
                  py={2.5}
                  transition="all 0.1s"
                  _selected={{
                    bg: redTabSelectedBg,
                    color: redTabSelectedColor,
                    boxShadow: 'none',
                  }}
                  _hover={{
                    color: tabHoverColor,
                  }}
                >
                  <HStack spacing={2}>
                    <Text fontSize="sm">📡</Text>
                    <Text>Send</Text>
                  </HStack>
                </Tab>
                <Tab
                  borderRadius={0}
                  fontWeight="700"
                  fontSize="sm"
                  letterSpacing="0.02em"
                  color={tabColor}
                  py={2.5}
                  transition="all 0.1s"
                  _selected={{
                    bg: blueTabSelectedBg,
                    color: blueTabSelectedColor,
                    boxShadow: 'none',
                  }}
                  _hover={{
                    color: tabHoverColor,
                  }}
                >
                  <HStack spacing={2}>
                    <Text fontSize="sm">🔓</Text>
                    <Text>Decrypt</Text>
                  </HStack>
                </Tab>
                <Tab
                  borderRadius={0}
                  fontWeight="700"
                  fontSize="sm"
                  letterSpacing="0.02em"
                  color={tabColor}
                  py={2.5}
                  transition="all 0.1s"
                  _selected={{
                    bg: greenTabSelectedBg,
                    color: greenTabSelectedColor,
                    boxShadow: 'none',
                  }}
                  _hover={{
                    color: tabHoverColor,
                  }}
                >
                  <HStack spacing={2}>
                    <Text fontSize="sm">📋</Text>
                    <Text>Feed</Text>
                  </HStack>
                </Tab>
                <Tab
                  borderRadius={0}
                  fontWeight="700"
                  fontSize="sm"
                  letterSpacing="0.02em"
                  color={tabColor}
                  py={2.5}
                  transition="all 0.1s"
                  _selected={{
                    bg: purpleTabSelectedBg,
                    color: purpleTabSelectedColor,
                    boxShadow: 'none',
                  }}
                  _hover={{
                    color: tabHoverColor,
                  }}
                >
                  <HStack spacing={2}>
                    <Text fontSize="sm">📊</Text>
                    <Text>Batch</Text>
                  </HStack>
                </Tab>
                <Tab
                  borderRadius={0}
                  fontWeight="700"
                  fontSize="sm"
                  letterSpacing="0.02em"
                  color={tabColor}
                  py={2.5}
                  transition="all 0.1s"
                  _selected={{
                    bg: orangeTabSelectedBg,
                    color: orangeTabSelectedColor,
                    boxShadow: 'none',
                  }}
                  _hover={{
                    color: tabHoverColor,
                  }}
                >
                  <HStack spacing={2}>
                    <Text fontSize="sm">🔍</Text>
                    <Text>Parse</Text>
                  </HStack>
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  <MessageComposer />
                </TabPanel>
                <TabPanel p={0}>
                  <Suspense
                    fallback={
                      <Center py={12}>
                        <Spinner color={blueSpinnerColor} size="lg" />
                      </Center>
                    }
                  >
                    <DecryptMessage />
                  </Suspense>
                </TabPanel>
                <TabPanel p={0}>
                  <Suspense
                    fallback={
                      <Center py={12}>
                        <Spinner color={greenSpinnerColor} size="lg" />
                      </Center>
                    }
                  >
                    <MessageFeed />
                  </Suspense>
                </TabPanel>
                <TabPanel p={0}>
                  <Suspense
                    fallback={
                      <Center py={12}>
                        <Spinner color={purpleSpinnerColor} size="lg" />
                      </Center>
                    }
                  >
                    <BatchSigner />
                  </Suspense>
                </TabPanel>
                <TabPanel p={0}>
                  <Suspense
                    fallback={
                      <Center py={12}>
                        <Spinner color={orangeSpinnerColor} size="lg" />
                      </Center>
                    }
                  >
                    <TransactionParser />
                  </Suspense>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Footer />
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

export default App
