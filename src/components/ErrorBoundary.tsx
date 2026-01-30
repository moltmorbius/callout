import { Component, type ReactNode } from 'react'
import { Box, Text, Button, VStack, Code } from '@chakra-ui/react'

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
    if (import.meta.env.DEV) {
      console.error('[Callout] React error boundary caught:', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="100vh"
          bg="#06060f"
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
              color="red.300"
              letterSpacing="0.05em"
            >
              Something went wrong
            </Text>
            <Text fontSize="sm" color="whiteAlpha.500" lineHeight="1.7">
              The app encountered an unexpected error. This may be due to a
              network issue or browser incompatibility. Try refreshing the page.
            </Text>
            {this.state.error && (
              <Code
                display="block"
                p={3}
                borderRadius="lg"
                fontSize="xs"
                bg="rgba(6, 6, 15, 0.9)"
                border="1px solid"
                borderColor="whiteAlpha.100"
                color="whiteAlpha.400"
                fontFamily="mono"
                maxW="100%"
                overflowX="auto"
                whiteSpace="pre-wrap"
                wordBreak="break-all"
              >
                {this.state.error.message}
              </Code>
            )}
            <Button
              onClick={() => window.location.reload()}
              bg="rgba(220, 38, 38, 0.15)"
              color="red.300"
              border="1px solid"
              borderColor="rgba(220, 38, 38, 0.3)"
              borderRadius="xl"
              fontWeight="700"
              _hover={{
                bg: 'rgba(220, 38, 38, 0.25)',
              }}
            >
              Reload Page
            </Button>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}
