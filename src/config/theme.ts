import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  styles: {
    global: {
      body: {
        bg: '#06060f',
        color: 'gray.100',
      },
    },
  },
  colors: {
    brand: {
      50: '#ffe5e5',
      100: '#ffb8b8',
      200: '#ff8a8a',
      300: '#ff5c5c',
      400: '#ff2e2e',
      500: '#e61414',
      600: '#b40e0e',
      700: '#820909',
      800: '#500404',
      900: '#210000',
    },
    surface: {
      50: '#14142b',
      100: '#1a1a3e',
      200: '#10101f',
      300: '#0d0d1a',
      400: '#0a0a14',
      500: '#06060f',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'red',
      },
      variants: {
        solid: {
          fontWeight: '700',
          letterSpacing: '0.02em',
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            fontFamily: "'JetBrains Mono', monospace",
            bg: 'rgba(10, 10, 26, 0.8)',
            borderColor: 'whiteAlpha.100',
            _hover: {
              borderColor: 'whiteAlpha.300',
            },
            _focus: {
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px rgba(229, 62, 62, 0.5)',
            },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          fontFamily: "'JetBrains Mono', monospace",
          bg: 'rgba(10, 10, 26, 0.8)',
          borderColor: 'whiteAlpha.100',
          _hover: {
            borderColor: 'whiteAlpha.300',
          },
          _focus: {
            borderColor: 'red.500',
            boxShadow: '0 0 0 1px rgba(229, 62, 62, 0.5)',
          },
        },
      },
    },
  },
})

export default theme
