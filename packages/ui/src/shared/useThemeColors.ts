/**
 * Helper hooks for accessing centralized theme colors.
 * These hooks automatically handle light/dark mode switching.
 */

import { useColorModeValue } from '@chakra-ui/react'
import {
  colors,
  getThemeValue,
  type AccentBgVariant,
  type AccentBorderVariant,
  type ThemeBgVariant,
  type ThemeTextVariant,
  type AccentTextVariant,
  type StatusTextVariant,
  type AccentColor,
  type CategoryColor,
  type ExtractSpecialVariants,
  type AccentColorWithText,
} from '../config/themeTokens'

/**
 * Hook to get theme-aware text color.
 *
 * @example
 * ```tsx
 * const textColor = useThemeTextColor('primary')
 * <Text color={textColor}>Hello</Text>
 * ```
 *
 * @param variant - Text color variant ('primary' | 'secondary' | 'muted' | 'veryMuted' | 'extraMuted' | 'hero' | 'heroSubtext' | 'footer' | 'footerMuted' | 'footerBrand' | 'tab' | 'tabHover' | 'tagline' | 'label')
 * @returns Theme-aware text color string
 */
export function useThemeTextColor(variant: Exclude<ThemeTextVariant, 'tabSelected'>): string {
  if (!colors.text[variant]) {
    const validVariants = Object.keys(colors.text).filter(k => k !== 'accent' && k !== 'status' && k !== 'tabSelected').join(', ')
    throw new Error(`Invalid text color variant: "${variant}". Valid variants: ${validVariants}`)
  }
  const colorValue = colors.text[variant]
  // Type guard to ensure we have { light, dark } structure
  if (!('light' in colorValue) || !('dark' in colorValue)) {
    throw new Error(`Invalid color structure for variant "${variant}". Expected { light, dark } structure.`)
  }
  return useColorModeValue(
    getThemeValue(colorValue as { light: string; dark: string }, 'light'),
    getThemeValue(colorValue as { light: string; dark: string }, 'dark')
  )
}

/**
 * Hook to get theme-aware background color.
 *
 * @example
 * ```tsx
 * const bgColor = useThemeBgColor('card')
 * <Box bg={bgColor}>Content</Box>
 * ```
 *
 * @param variant - Background color variant ('primary' | 'card' | 'cardHover' | 'input' | 'header' | 'tabList' | 'button' | 'buttonHover' | 'interactiveHover' | 'tooltip')
 * @returns Theme-aware background color string
 * @throws Error if variant is invalid
 */
export function useThemeBgColor(variant: Exclude<ThemeBgVariant, 'tabSelected'>): string {
  if (!colors.bg[variant]) {
    const validVariants = Object.keys(colors.bg).filter(k => k !== 'tabSelected').join(', ')
    throw new Error(`Invalid background color variant: "${variant}". Valid variants: ${validVariants}`)
  }
  const colorValue = colors.bg[variant]
  // Type guard to ensure we have { light, dark } structure
  if (!('light' in colorValue) || !('dark' in colorValue)) {
    throw new Error(`Invalid color structure for variant "${variant}". Expected { light, dark } structure.`)
  }
  return useColorModeValue(
    getThemeValue(colorValue as { light: string; dark: string }, 'light'),
    getThemeValue(colorValue as { light: string; dark: string }, 'dark')
  )
}

/**
 * Hook to get theme-aware accent text color.
 * Usage: const accentColor = useAccentTextColor('red')
 */
export function useAccentTextColor(variant: AccentTextVariant): string {
  const colorValue = colors.text.accent[variant]
  if (!colorValue) {
    const validVariants = Object.keys(colors.text.accent).join(', ')
    throw new Error(`Invalid accent text color variant: "${variant}". Valid variants: ${validVariants}`)
  }
  if (typeof colorValue === 'string') {
    // Legacy format - return as-is (shouldn't happen after migration)
    return colorValue
  }
  return useColorModeValue(
    colorValue.light,
    colorValue.dark
  )
}

/**
 * Hook to get theme-aware status text color.
 * Usage: const statusColor = useStatusTextColor('success')
 */
export function useStatusTextColor(variant: StatusTextVariant): string {
  const colorValue = colors.text.status[variant]
  if (!colorValue) {
    const validVariants = Object.keys(colors.text.status).join(', ')
    throw new Error(`Invalid status text color variant: "${variant}". Valid variants: ${validVariants}`)
  }
  if (typeof colorValue === 'string') {
    // Legacy format - return as-is (shouldn't happen after migration)
    return colorValue
  }
  return useColorModeValue(
    colorValue.light,
    colorValue.dark
  )
}

/**
 * Hook to get theme-aware accent background color.
 * Type-safe: only allows variants that exist for the specified color.
 *
 * @example
 * ```tsx
 * const bg = useAccentBgColor('blue', 'bg') // ✅ Valid
 * const bgStrong = useAccentBgColor('blue', 'bgStrong') // ✅ Valid
 * const bgMeta = useAccentBgColor('blue', 'bgMeta') // ❌ TypeScript error - bgMeta only exists for purple
 * ```
 *
 * @param color - The accent color name ('blue' | 'green' | 'yellow' | 'purple' | 'red')
 * @param variant - The background variant (type-safe based on color)
 * @returns Theme-aware background color string
 * @throws Error if color or variant is invalid
 */
export function useAccentBgColor<T extends AccentColor>(
  color: T,
  variant: AccentBgVariant<T>
): string {
  const accentColor = colors.accent[color]
  if (!accentColor || typeof accentColor !== 'object') {
    const validColors = ['blue', 'green', 'yellow', 'purple', 'red'].join(', ')
    throw new Error(`Invalid accent color: "${color}". Valid colors: ${validColors}`)
  }
  const variantValue = (accentColor as Record<string, { light: string; dark: string } | string>)[variant]
  if (!variantValue) {
    // Get available variants for better error message
    const availableVariants = Object.keys(accentColor).filter(k => k.startsWith('bg')).join(', ')
    throw new Error(
      `Invalid accent color variant: "${color}.${variant}". ` +
      `Available variants for ${color}: ${availableVariants || 'none'}`
    )
  }
  if (typeof variantValue === 'string') {
    return variantValue
  }
  return useColorModeValue(
    variantValue.light,
    variantValue.dark
  )
}

/**
 * Hook to get theme-aware accent border color.
 * Type-safe: only allows variants that exist for the specified color.
 *
 * @example
 * ```tsx
 * const border = useAccentBorderColor('blue', 'border') // ✅ Valid
 * const borderMeta = useAccentBorderColor('purple', 'borderMeta') // ✅ Valid
 * const borderMeta = useAccentBorderColor('blue', 'borderMeta') // ❌ TypeScript error - borderMeta only exists for purple
 * ```
 *
 * @param color - The accent color name ('blue' | 'green' | 'yellow' | 'purple' | 'red')
 * @param variant - The border variant (type-safe based on color)
 * @returns Theme-aware border color string
 * @throws Error if color or variant is invalid
 */
export function useAccentBorderColor<T extends AccentColor>(
  color: T,
  variant: AccentBorderVariant<T>
): string {
  const accentColor = colors.accent[color]
  if (!accentColor || typeof accentColor !== 'object') {
    const validColors = ['blue', 'green', 'yellow', 'purple', 'red'].join(', ')
    throw new Error(`Invalid accent color: "${color}". Valid colors: ${validColors}`)
  }
  const variantValue = (accentColor as Record<string, { light: string; dark: string } | string>)[variant]
  if (!variantValue) {
    // Get available variants for better error message
    const availableVariants = Object.keys(accentColor).filter(k => k.startsWith('border')).join(', ')
    throw new Error(
      `Invalid accent color variant: "${color}.${variant}". ` +
      `Available variants for ${color}: ${availableVariants || 'none'}`
    )
  }
  if (typeof variantValue === 'string') {
    return variantValue
  }
  return useColorModeValue(
    variantValue.light,
    variantValue.dark
  )
}

/**
 * Hook to get theme-aware accent color text property.
 * Usage: const textColor = useAccentColorText('blue')
 * Note: This accesses colors.accent[color].text, not colors.text.accent
 */
export function useAccentColorText(color: AccentColorWithText): string {
  const accentColor = colors.accent[color]
  if (!accentColor || typeof accentColor !== 'object') {
    throw new Error(`Invalid accent color: ${color}`)
  }
  if (!('text' in accentColor)) {
    throw new Error(`Accent color ${color} does not have a text property`)
  }
  const textValue = accentColor.text
  if (typeof textValue === 'string') {
    return textValue
  }
  return useColorModeValue(
    textValue.light,
    textValue.dark
  )
}

/**
 * Hook to get theme-aware accent gradient color.
 * Usage: const gradient = useAccentGradient('blue')
 */
export function useAccentGradient(color: Extract<'blue' | 'green' | 'yellow' | 'orange', AccentColor>): string {
  const accentColor = colors.accent[color]
  if (!accentColor || typeof accentColor !== 'object' || !('gradient' in accentColor)) {
    throw new Error(`Invalid accent color or no gradient: ${color}`)
  }
  const gradientValue = accentColor.gradient
  if (typeof gradientValue === 'string') {
    return gradientValue
  }
  return useColorModeValue(
    gradientValue.light,
    gradientValue.dark
  )
}

/**
 * Hook to get theme-aware accent special colors (scan, focus, etc.).
 * Usage: const scanBg = useAccentSpecialColor('blue', 'scanBg')
 *
 * Only works for colors that have special variants (currently blue and yellow).
 * TypeScript will error if you try to use a color without special variants.
 */
export function useAccentSpecialColor<T extends AccentColor>(
  color: T,
  variant: ExtractSpecialVariants<T>
): string {
  const accentColor = colors.accent[color]
  if (!accentColor || typeof accentColor !== 'object') {
    throw new Error(`Invalid accent color: ${color}`)
  }
  // Type assertion needed because ExtractSpecialVariants<T> is a computed type
  const variantValue = (accentColor as Record<string, { light: string; dark: string } | string>)[String(variant)]
  if (!variantValue || typeof variantValue === 'string') {
    return variantValue as string
  }
  return useColorModeValue(
    variantValue.light,
    variantValue.dark
  )
}

/**
 * Hook to get theme-aware category colors for template/category cards.
 * Returns all color values needed for styling category and template cards.
 *
 * @example
 * ```tsx
 * const categoryColors = useCategoryColors('green')
 * // Returns: { bg, bgHover, border, glow, text, badge, iconBg }
 * <Box bg={categoryColors.bg} borderColor={categoryColors.border}>
 * ```
 *
 * @param color - The category color name ('green' | 'yellow' | 'red' | 'orange' | 'purple' | 'blue')
 * @returns Object with theme-aware category color values
 * @throws Error if color is invalid
 */
export function useCategoryColors(color: CategoryColor) {
  const categoryColor = colors.category[color]
  if (!categoryColor) {
    const validColors = ['green', 'yellow', 'red', 'orange', 'purple', 'blue'].join(', ')
    throw new Error(`Invalid category color: "${color}". Valid colors: ${validColors}`)
  }

  return {
    bg: useColorModeValue(
      getThemeValue(categoryColor.bg, 'light'),
      getThemeValue(categoryColor.bg, 'dark')
    ),
    bgHover: useColorModeValue(
      getThemeValue(categoryColor.bgHover, 'light'),
      getThemeValue(categoryColor.bgHover, 'dark')
    ),
    border: useColorModeValue(
      getThemeValue(categoryColor.border, 'light'),
      getThemeValue(categoryColor.border, 'dark')
    ),
    glow: useColorModeValue(
      getThemeValue(categoryColor.glow, 'light'),
      getThemeValue(categoryColor.glow, 'dark')
    ),
    text: useColorModeValue(
      getThemeValue(categoryColor.text, 'light'),
      getThemeValue(categoryColor.text, 'dark')
    ),
    badge: useColorModeValue(
      getThemeValue(categoryColor.badge, 'light'),
      getThemeValue(categoryColor.badge, 'dark')
    ),
    iconBg: useColorModeValue(
      getThemeValue(categoryColor.iconBg, 'light'),
      getThemeValue(categoryColor.iconBg, 'dark')
    ),
  }
}

/**
 * Hook to get theme-aware status color (success, warning, error, info, pending).
 * Usage: const successColor = useStatusColor('success')
 */
export function useStatusColor(variant: StatusTextVariant): string {
  const colorValue = colors.text.status[variant]
  if (!colorValue) {
    const validVariants = Object.keys(colors.text.status).join(', ')
    throw new Error(`Invalid status color variant: "${variant}". Valid variants: ${validVariants}`)
  }
  if (typeof colorValue === 'string') {
    // Legacy format - return as-is (shouldn't happen after migration)
    return colorValue
  }
  return useColorModeValue(
    colorValue.light,
    colorValue.dark
  )
}

/**
 * Hook to get theme-aware red accent shadow color.
 * Usage: const shadow = useAccentShadow('red', 'shadow')
 */
export function useAccentShadow<T extends Extract<'red' | 'purple', AccentColor>>(
  color: T,
  variant: 'shadow' | 'shadowStrong' | 'shadowGlow'
): string {
  const accentColor = colors.accent[color]
  if (!accentColor || typeof accentColor !== 'object') {
    throw new Error(`Invalid accent color: ${color}`)
  }
  const variantValue = (accentColor as Record<string, { light: string; dark: string } | string>)[variant]
  if (!variantValue) {
    throw new Error(`Invalid shadow variant: ${variant} for color: ${color}`)
  }
  if (typeof variantValue === 'string') {
    return variantValue
  }
  return useColorModeValue(
    variantValue.light,
    variantValue.dark
  )
}

/* ── Pattern Hooks ──────────────────────────────────────────────── */
/* These hooks extract common patterns of multiple color hooks used together */

/**
 * Hook to get purple meta colors (background, border, and border shadow).
 * Used for metadata/info boxes with purple accent.
 *
 * @example
 * ```tsx
 * const purpleMeta = usePurpleMetaColors()
 * <Box bg={purpleMeta.bg} boxShadow={purpleMeta.borderShadow}>
 * ```
 *
 * @returns Object with bg, borderColor, and borderShadow
 */
export function usePurpleMetaColors() {
  const bg = useAccentBgColor('purple', 'bgMeta')
  const borderColor = useAccentBorderColor('purple', 'borderMeta')
  const borderShadow = `0 0 0 1px ${borderColor}`
  return { bg, borderColor, borderShadow }
}

/**
 * Hook to get red button colors (background, border, text, and hover background).
 * Used for primary action buttons with red accent.
 *
 * @example
 * ```tsx
 * const redButton = useRedButtonColors()
 * <Button bg={redButton.bg} color={redButton.text} boxShadow={redButton.borderShadow}>
 * ```
 *
 * @returns Object with bg, borderColor, borderShadow, text, and hoverBg
 */
export function useRedButtonColors() {
  const bg = useAccentBgColor('red', 'bg')
  const borderColor = useAccentBorderColor('red', 'border')
  const borderShadow = `0 0 0 1px ${borderColor}`
  const text = useAccentTextColor('redLight')
  const hoverBg = useAccentBgColor('red', 'bg')
  return { bg, borderColor, borderShadow, text, hoverBg }
}

/**
 * Hook to get red meta colors (background, border, and border shadow).
 * Used for metadata/info boxes with red accent.
 *
 * @example
 * ```tsx
 * const redMeta = useRedMetaColors()
 * <Box bg={redMeta.bg} boxShadow={redMeta.borderShadow}>
 * ```
 *
 * @returns Object with bg, borderColor, and borderShadow
 */
export function useRedMetaColors() {
  const bg = useAccentBgColor('red', 'bg')
  const borderColor = useAccentBorderColor('red', 'border')
  const borderShadow = `0 0 0 1px ${borderColor}`
  return { bg, borderColor, borderShadow }
}

/**
 * Hook to get yellow encrypted colors (background, border, and text).
 * Used for encrypted/error state indicators with yellow accent.
 *
 * @example
 * ```tsx
 * const yellowEncrypted = useYellowEncryptedColors()
 * <Box bg={yellowEncrypted.bg} borderColor={yellowEncrypted.borderColor} color={yellowEncrypted.text}>
 * ```
 *
 * @returns Object with bg, borderColor, borderShadow, and text
 */
export function useYellowEncryptedColors() {
  const bg = useAccentBgColor('yellow', 'bgEncrypted')
  const borderColor = useAccentBorderColor('yellow', 'borderEncrypted')
  const borderShadow = `0 0 0 1px ${borderColor}`
  const text = useAccentTextColor('yellow')
  return { bg, borderColor, borderShadow, text }
}

/**
 * Hook to get green verified colors (background, border, and text).
 * Used for verified/success state indicators with green accent.
 *
 * @example
 * ```tsx
 * const greenVerified = useGreenVerifiedColors()
 * <Box bg={greenVerified.bg} borderColor={greenVerified.borderColor} color={greenVerified.text}>
 * ```
 *
 * @returns Object with bg, borderColor, borderShadow, text, and textLight
 */
export function useGreenVerifiedColors() {
  const bg = useAccentBgColor('green', 'bg')
  const borderColor = useAccentBorderColor('green', 'border')
  const borderShadow = `0 0 0 1px ${borderColor}`
  const text = useAccentTextColor('green')
  const textLight = useAccentTextColor('greenLight')
  return { bg, borderColor, borderShadow, text, textLight }
}

/**
 * Hook to get blue badge colors (background, border, and text).
 * Used for badge components with blue accent.
 *
 * @example
 * ```tsx
 * const blueBadge = useBlueBadgeColors()
 * <Badge bg={blueBadge.bg} borderColor={blueBadge.borderColor} color={blueBadge.text}>
 * ```
 *
 * @returns Object with bg, borderColor, text, and textLight
 */
export function useBlueBadgeColors() {
  const bg = useAccentBgColor('blue', 'bgStrong')
  const borderColor = useAccentBorderColor('blue', 'border')
  const text = useAccentTextColor('blue')
  const textLight = useAccentTextColor('blueLight')
  return { bg, borderColor, text, textLight }
}

/**
 * Hook to get green meta colors (background, border, and border shadow).
 * Used for success/verified metadata boxes with green accent.
 *
 * @example
 * ```tsx
 * const greenMeta = useGreenMetaColors()
 * <Box bg={greenMeta.bg} boxShadow={greenMeta.borderShadow}>
 * ```
 *
 * @returns Object with bg, borderColor, and borderShadow
 */
export function useGreenMetaColors() {
  const bg = useAccentBgColor('green', 'bgSubtle')
  const borderColor = useAccentBorderColor('green', 'borderVerified')
  const borderShadow = `0 0 0 1px ${borderColor}`
  return { bg, borderColor, borderShadow }
}

/**
 * Hook to get purple badge colors (background, border, and text).
 * Used for badge components with purple accent.
 *
 * @example
 * ```tsx
 * const purpleBadge = usePurpleBadgeColors()
 * <Badge bg={purpleBadge.bg} borderColor={purpleBadge.borderColor} color={purpleBadge.text}>
 * ```
 *
 * @returns Object with bg, borderColor, and text
 */
export function usePurpleBadgeColors() {
  const bg = useAccentBgColor('purple', 'bgBadge')
  const borderColor = useAccentBorderColor('purple', 'borderBadge')
  const text = useAccentTextColor('purple')
  return { bg, borderColor, text }
}

/**
 * Hook to get blue icon colors (background and border).
 * Used for icon boxes with blue accent.
 *
 * @example
 * ```tsx
 * const blueIcon = useBlueIconColors()
 * <Box bg={blueIcon.bg} borderColor={blueIcon.borderColor}>
 * ```
 *
 * @returns Object with bg and borderColor
 */
export function useBlueIconColors() {
  const bg = useAccentBgColor('blue', 'bg')
  const borderColor = useAccentBorderColor('blue', 'border')
  return { bg, borderColor }
}
