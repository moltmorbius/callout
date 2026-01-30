import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    mono: `'JetBrains Mono', 'Fira Code', monospace`,
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
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    surface: {
      base: '#06060f',
      raised: '#0c0c1a',
      overlay: '#111125',
      border: 'rgba(255, 255, 255, 0.06)',
      borderHover: 'rgba(255, 255, 255, 0.12)',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'red',
      },
      variants: {
        solid: {
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'rgba(0, 0, 0, 0.3)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            _hover: {
              borderColor: 'rgba(255, 255, 255, 0.16)',
            },
            _focus: {
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.4)',
            },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          bg: 'rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          _hover: {
            borderColor: 'rgba(255, 255, 255, 0.16)',
          },
          _focus: {
            borderColor: 'red.500',
            boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.4)',
          },
        },
      },
    },
    Tabs: {
      variants: {
        'soft-rounded': {
          tab: {
            fontWeight: 600,
            letterSpacing: '0.01em',
            _selected: {
              bg: 'red.600',
              color: 'white',
            },
          },
        },
      },
    },
  },
})

export default theme
