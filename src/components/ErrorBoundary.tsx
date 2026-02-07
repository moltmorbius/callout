import { Component, type ReactNode } from 'react'
import { Box, Text, Button, VStack, Code, useColorModeValue } from '@chakra-ui/react'
import { logError } from '../utils/logger'
import { borderRadius, boxShadows, getThemeValue, colors } from '../config/themeTokens'
import { useAccentTextColor, useAccentBgColor, useAccentBorderColor, useRedButtonColors } from '../shared/useThemeColors'

/**
 * Button component for ErrorBoundary that can use hooks.
 * ErrorBoundary must be a class component, so we extract the button to use hooks.
 */
function ErrorBoundaryButton() {
  const redButton = useRedButtonColors()
  const buttonColor = redButton.text

  return (
    <Button
      onClick={() => window.location.reload()}
      bg={redButton.bg}
      color={redButton.text}
      border="none"
      boxShadow={redButton.borderShadow}
      borderRadius={borderRadius.none}
      fontWeight="700"
      _hover={{
        bg: redButton.hoverBg,
      }}
    >
      Reload Page
    </Button>
  )
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // Always log boundary errors — even in production — so crashes are visible
    console.error('[Callout] React error boundary caught:', error, info)
    logError('React error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      // Note: ErrorBoundary is a class component, so we can't use hooks directly
      // We'll use static theme values for dark mode as fallback
      const bgColor = getThemeValue(colors.bg.primary, 'dark')
      const textColor = getThemeValue(colors.text.primary, 'dark')
      const textMuted = getThemeValue(colors.text.muted, 'dark')
      const textVeryMuted = getThemeValue(colors.text.veryMuted, 'dark')
      const codeBg = getThemeValue(colors.bg.input, 'dark')
      const codeText = getThemeValue(colors.text.primary, 'dark')
      const borderShadow = getThemeValue(boxShadows.borderCard, 'dark')
      const buttonColor = getThemeValue(colors.text.accent.redLight, 'dark')

      return (
        <Box
          minH="100vh"
          bg={bgColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={6}
        >
          <VStack spacing={5} maxW="480px" textAlign="center">
            <Text fontSize="4xl">⚠️</Text>
            <Text
              fontSize="xl"
              fontWeight="800"
              color={buttonColor}
              letterSpacing="0.05em"
            >
              Something went wrong
            </Text>
            <Text fontSize="sm" color={textMuted} lineHeight="1.7">
              The app encountered an unexpected error. This may be due to a
              network issue or browser incompatibility. Try refreshing the page.
            </Text>
            {this.state.error && (
              <Code
                display="block"
                p={3}
                borderRadius={borderRadius.none}
                fontSize="xs"
                bg={codeBg}
                border="none"
                boxShadow={borderShadow}
                color={codeText}
                fontFamily="mono"
                maxW="100%"
                overflowX="auto"
                whiteSpace="pre-wrap"
                wordBreak="break-all"
                className="custom-scrollbar"
              >
                {this.state.error.message}
              </Code>
            )}
            <ErrorBoundaryButton />
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}
