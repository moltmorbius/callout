import { Box, type BoxProps } from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/react'
import { useThemeBgColor, useThemeTextColor, useAccentBorderColor, useAccentSpecialColor } from './useThemeColors'
import { boxShadows, borderRadius, getThemeValue } from '../config/themeTokens'
import { useRef, useEffect, useCallback, useState } from 'react'

interface ThemedTextareaProps extends Omit<BoxProps, 'bg' | 'color' | 'border' | 'boxShadow' | 'onChange'> {
  /** Accent color for focus/hover states. Defaults to 'purple' */
  accentColor?: 'purple' | 'blue'
  /** Font size. Defaults to 'xs' */
  size?: 'xs' | 'sm' | 'md'
  /** Whether to use monospace font. Defaults to false */
  monospace?: boolean
  /** Value of the textarea */
  value?: string
  /** Callback when value changes */
  onChange?: (e: React.ChangeEvent<HTMLDivElement>) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the textarea is read-only */
  readOnly?: boolean
  /** Number of rows (converted to minHeight) */
  rows?: number
}

/**
 * Shared Textarea component with consistent theming across the app.
 * Uses a contenteditable div instead of textarea to allow better styling control.
 * Handles all common styling including background, borders, hover, and focus states.
 * Supports vertical resizing and preserves textarea-like behavior.
 */
export function ThemedTextarea({
  accentColor = 'purple',
  size = 'xs',
  monospace = false,
  value = '',
  onChange,
  placeholder,
  readOnly = false,
  rows,
  maxHeight = '300px',
  onFocus,
  onBlur,
  ...props
}: ThemedTextareaProps) {
  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')
  const inputPlaceholder = useThemeTextColor('extraMuted')
  const boxShadowValue = useColorModeValue(
    getThemeValue(boxShadows.borderInput, 'light'),
    getThemeValue(boxShadows.borderInput, 'dark')
  )
  const divRef = useRef<HTMLDivElement>(null)
  const [manualHeight, setManualHeight] = useState<string | null>(null)
  const [isResizing, setIsResizing] = useState(false)

  const fontSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'
  const fontFamily = monospace ? 'monospace' : undefined

  // Focus colors based on accent
  const blueBorderFocus = useAccentBorderColor('blue', 'borderFocus')
  const blueShadowFocus = useAccentSpecialColor('blue', 'shadowFocus')
  const purpleBorderFocus = useAccentBorderColor('purple', 'borderFocus')
  const focusShadow = accentColor === 'blue'
    ? `0 0 0 1px ${blueBorderFocus}, 0 0 20px ${blueShadowFocus}`
    : `0 0 0 1px ${purpleBorderFocus}`

  const blueBorderFocusStrong = useAccentBorderColor('blue', 'borderFocusStrong')
  const hoverShadow = accentColor === 'blue'
    ? `0 0 0 1px ${blueBorderFocusStrong}`
    : `0 0 0 1px ${purpleBorderFocus}`

  // Sync value prop with div content
  useEffect(() => {
    if (divRef.current && divRef.current.textContent !== value) {
      divRef.current.textContent = value
    }
  }, [value])

  // Handle input events and emit onChange
  const handleInput = useCallback((e: React.SyntheticEvent<HTMLDivElement>) => {
    if (onChange && divRef.current) {
      // Create a synthetic event that matches React.ChangeEvent<HTMLDivElement>
      // with a value property on target to match textarea API
      const textContent = divRef.current.textContent || ''
      const syntheticEvent = {
        ...e,
        target: Object.assign(e.currentTarget, {
          value: textContent,
        }),
        currentTarget: Object.assign(e.currentTarget, {
          value: textContent,
        }),
      } as unknown as React.ChangeEvent<HTMLDivElement>
      onChange(syntheticEvent)
    }
  }, [onChange])

  // Calculate minHeight from rows (approximate: ~1.5rem per row)
  const minHeight = rows ? `${rows * 1.5}rem` : undefined

  // Track manual resizing to allow exceeding initial maxHeight
  useEffect(() => {
    const element = divRef.current
    if (!element) return

    const parseHeight = (height: unknown): number => {
      if (typeof height === 'number') return height
      if (typeof height === 'string') {
        const match = height.match(/(\d+(?:\.\d+)?)(px|rem|em)/)
        if (!match) return 300 // default fallback
        const value = parseFloat(match[1])
        const unit = match[2]
        // Convert to px (approximate for rem/em)
        return unit === 'px' ? value : value * 16
      }
      return 300 // default fallback
    }

    const initialMaxHeight = parseHeight(maxHeight)

    const resizeObserver = new ResizeObserver(() => {
      if (isResizing && element.offsetHeight > initialMaxHeight) {
        setManualHeight(`${element.offsetHeight}px`)
      }
    })

    const handleMouseDown = (e: MouseEvent) => {
      // Check if click is near the bottom edge (resize handle area)
      const rect = element.getBoundingClientRect()
      const isNearBottom = e.clientY > rect.bottom - 10
      if (isNearBottom) {
        setIsResizing(true)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    resizeObserver.observe(element)
    element.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      resizeObserver.disconnect()
      element.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [maxHeight, isResizing])

  // Use manualHeight if set, otherwise use maxHeight for initial constraint
  // When resizing, allow unlimited height
  const effectiveMaxHeight = isResizing ? 'none' : (manualHeight || maxHeight)

  return (
    <Box
      ref={divRef}
      as="div"
      contentEditable={!readOnly}
      fontSize={fontSize}
      fontFamily={fontFamily}
      bg={inputBg}
      color={inputText}
      border="none"
      borderRadius={borderRadius.none}
      boxShadow={boxShadowValue}
      maxHeight={effectiveMaxHeight}
      minHeight={minHeight}
      overflowY="auto"
      whiteSpace="pre-wrap"
      wordBreak="break-word"
      resize="vertical"
      outline="none"
      px={3}
      py={2}
      className="custom-scrollbar"
      // sx={placeholderStyles}
      _hover={{
        boxShadow: hoverShadow,
      }}
      _focus={{
        boxShadow: focusShadow,
      }}
      onInput={handleInput}
      onFocus={onFocus}
      onBlur={onBlur}
      suppressContentEditableWarning
      {...props}
    />
  )
}
