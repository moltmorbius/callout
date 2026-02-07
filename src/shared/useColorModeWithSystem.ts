/**
 * Custom hook for 3-way color mode toggle: light, system, dark.
 * Stores preference in localStorage and handles system preference detection.
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useColorMode as useChakraColorMode } from '@chakra-ui/react'

const COLOR_MODE_STORAGE_KEY = 'callout-color-mode-preference'
type ColorModePreference = 'light' | 'dark' | 'system'

/**
 * Gets the system color mode preference from the OS.
 */
function getSystemColorMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Loads the color mode preference from localStorage.
 * Defaults to 'system' if not set.
 */
function loadColorModePreference(): ColorModePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const saved = localStorage.getItem(COLOR_MODE_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'system'
}

/**
 * Saves the color mode preference to localStorage.
 */
function saveColorModePreference(preference: ColorModePreference): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference)
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Custom hook for 3-way color mode toggle (light, system, dark).
 *
 * @returns Object with:
 *   - colorMode: The effective color mode ('light' | 'dark')
 *   - preference: The user's preference ('light' | 'dark' | 'system')
 *   - cycleColorMode: Function to cycle through light -> system -> dark -> light
 *   - setColorModePreference: Function to set a specific preference ('light' | 'dark' | 'system')
 */
export function useColorModeWithSystem() {
  const { colorMode: chakraColorMode, setColorMode: setChakraColorMode } = useChakraColorMode()
  const [preference, setPreference] = useState<ColorModePreference>(() => loadColorModePreference())
  const [systemColorMode, setSystemColorMode] = useState<'light' | 'dark'>(() => getSystemColorMode())

  // Determine effective color mode based on preference
  const effectiveColorMode: 'light' | 'dark' = useMemo(() => {
    return preference === 'system' ? systemColorMode : preference
  }, [preference, systemColorMode])

  // Sync Chakra's color mode with effective color mode when it changes
  useEffect(() => {
    if (chakraColorMode !== effectiveColorMode) {
      setChakraColorMode(effectiveColorMode)
    }
  }, [effectiveColorMode, chakraColorMode, setChakraColorMode])

  // Listen for system preference changes when in system mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newSystemMode = mediaQuery.matches ? 'dark' : 'light'
      setSystemColorMode(newSystemMode)
    }

    // Update initial system mode
    setSystemColorMode(getSystemColorMode())

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  // Cycle through light -> system -> dark -> light
  const cycleColorMode = useCallback(() => {
    const nextPreference: ColorModePreference =
      preference === 'light' ? 'system' :
        preference === 'system' ? 'dark' :
          'light'

    setPreference(nextPreference)
    saveColorModePreference(nextPreference)
  }, [preference])

  // Set a specific preference
  const setColorModePreference = useCallback((newPreference: ColorModePreference) => {
    setPreference(newPreference)
    saveColorModePreference(newPreference)
  }, [])

  return {
    colorMode: effectiveColorMode,
    preference,
    cycleColorMode,
    setColorModePreference,
  }
}
