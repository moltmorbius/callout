import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import { colors as themeTokens, borderRadius, boxShadows } from './themeTokens'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false, // Handled manually via useColorModeWithSystem hook
}

/**
 * Centralized theme system with semantic color tokens.
 * Colors can be referenced by their semantic name (e.g., button.border, card.bg)
 * and automatically adapt to light/dark mode.
 */
const theme = extendTheme({
  config,
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  styles: {
    global: (props: { colorMode: 'light' | 'dark' }) => ({
      body: {
        bg: props.colorMode === 'dark'
          ? themeTokens.bg.primary.dark
          : themeTokens.bg.primary.light,
        color: props.colorMode === 'dark'
          ? themeTokens.text.primary.dark
          : themeTokens.text.primary.light,
      },
      '*::-webkit-scrollbar': {
        borderRadius: '0',
      },
      '*::-webkit-scrollbar-track': {
        borderRadius: '0',
      },
      '*::-webkit-scrollbar-thumb': {
        borderRadius: '0',
      },
      '*::-webkit-scrollbar-corner': {
        borderRadius: '0',
      },
    }),
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
    // Semantic color tokens - accessible via colors.text.primary, colors.bg.card, etc.
    // These are flattened for Chakra theme access, but values come from centralized themeTokens
    text: {
      primary: themeTokens.text.primary.dark, // Default to dark, components use useColorModeValue
      secondary: themeTokens.text.secondary.dark,
      muted: themeTokens.text.muted.dark,
      veryMuted: themeTokens.text.veryMuted.dark,
      extraMuted: themeTokens.text.extraMuted.dark,
      hero: themeTokens.text.hero.dark,
      heroSubtext: themeTokens.text.heroSubtext.dark,
      footer: themeTokens.text.footer.dark,
      footerMuted: themeTokens.text.footerMuted.dark,
      footerBrand: themeTokens.text.footerBrand.dark,
      tab: themeTokens.text.tab.dark,
      tabHover: themeTokens.text.tabHover.dark,
      tagline: themeTokens.text.tagline.dark,
      // Accent colors (not theme-aware)
      accentRed: themeTokens.text.accent.red,
      accentRedLight: themeTokens.text.accent.redLight,
      accentBlue: themeTokens.text.accent.blue,
      accentBlueLight: themeTokens.text.accent.blueLight,
      accentGreen: themeTokens.text.accent.green,
      accentGreenLight: themeTokens.text.accent.greenLight,
      accentPurple: themeTokens.text.accent.purple,
      accentPurpleLight: themeTokens.text.accent.purpleLight,
      accentOrange: themeTokens.text.accent.orange,
      accentOrangeLight: themeTokens.text.accent.orangeLight,
      accentYellow: themeTokens.text.accent.yellow,
      // Status colors
      statusSuccess: themeTokens.text.status.success,
      statusWarning: themeTokens.text.status.warning,
      statusError: themeTokens.text.status.error,
      statusInfo: themeTokens.text.status.info,
      statusPending: themeTokens.text.status.pending,
    },
    bg: {
      card: themeTokens.bg.card.dark,
      cardHover: themeTokens.bg.cardHover.dark,
      input: themeTokens.bg.input.dark,
      header: themeTokens.bg.header.dark,
      tabList: themeTokens.bg.tabList.dark,
      button: themeTokens.bg.button.dark,
      buttonHover: themeTokens.bg.buttonHover.dark,
    },
    border: {
      // Note: These are box-shadow values, not actual border colors
      default: boxShadows.border.dark,
      accent: boxShadows.borderAccent.dark,
      input: boxShadows.borderInput.dark,
      inputFocus: boxShadows.borderInputFocus.dark,
      card: boxShadows.borderCard.dark,
      cardHover: boxShadows.borderCardHover.dark,
      button: boxShadows.borderButton.dark,
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'red',
      },
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        borderRadius: borderRadius.none,
        fontWeight: '700',
        letterSpacing: '0.02em',
        boxShadow: props.colorMode === 'light'
          ? boxShadows.borderButton.light
          : boxShadows.borderButton.dark,
        border: 'none',
      }),
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
            borderRadius: borderRadius.none,
            border: 'none',
            boxShadow: (props: { colorMode: 'light' | 'dark' }) =>
              props.colorMode === 'light'
                ? boxShadows.borderInput.light
                : boxShadows.borderInput.dark,
            bg: (props: { colorMode: 'light' | 'dark' }) =>
              props.colorMode === 'light'
                ? themeTokens.bg.input.light
                : themeTokens.bg.input.dark,
            _hover: {
              boxShadow: (props: { colorMode: 'light' | 'dark' }) =>
                props.colorMode === 'light'
                  ? boxShadows.borderInputHover.light
                  : boxShadows.borderInputHover.dark,
            },
            _focus: {
              boxShadow: boxShadows.borderInputFocus.dark,
            },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          fontFamily: "'JetBrains Mono', monospace",
          borderRadius: borderRadius.none,
          border: 'none',
          boxShadow: (props: { colorMode: 'light' | 'dark' }) =>
            props.colorMode === 'light'
              ? boxShadows.borderInput.light
              : boxShadows.borderInput.dark,
          bg: (props: { colorMode: 'light' | 'dark' }) =>
            props.colorMode === 'light'
              ? themeTokens.bg.input.light
              : themeTokens.bg.input.dark,
          _hover: {
            boxShadow: (props: { colorMode: 'light' | 'dark' }) =>
              props.colorMode === 'light'
                ? boxShadows.borderInputHover.light
                : boxShadows.borderInputHover.dark,
          },
          _focus: {
            boxShadow: boxShadows.borderInputFocus.dark,
          },
        },
      },
    },
  },
})

export default theme
