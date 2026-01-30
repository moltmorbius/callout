import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  styles: {
    global: {
      body: {
        bg: '#0a0a1a',
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
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'red',
      },
    },
    Tabs: {
      variants: {
        'soft-rounded': {
          tab: {
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
