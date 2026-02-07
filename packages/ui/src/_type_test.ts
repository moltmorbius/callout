/* eslint-disable @typescript-eslint/no-unused-vars */
// Temporary file to verify the fix for AccentBgVariant type resolution
// This imports the ACTUAL types from themeTokens after the fix
import { type AccentColor, type AccentBgVariant, type AccentBorderVariant } from '../config/themeTokens'

// ── Verify the exported types are now strict ────────────────────────

// Test 1: Valid red bg variants should work
function _testRedBg(_v: AccentBgVariant<'red'>): void { /* noop */ }
_testRedBg('bg')
_testRedBg('bgHover')
_testRedBg('bgButton')

// Test 2: Invalid red bg variants should error
// @ts-expect-error - bgBadge does NOT exist on red
_testRedBg('bgBadge')
// @ts-expect-error - bgMeta does NOT exist on red
_testRedBg('bgMeta')

// Test 3: Valid purple bg variants should work
function _testPurpleBg(_v: AccentBgVariant<'purple'>): void { /* noop */ }
_testPurpleBg('bgBadge')
_testPurpleBg('bgMeta')

// Test 4: Invalid purple bg variants should error
// @ts-expect-error - bgGradient does NOT exist on purple
_testPurpleBg('bgGradient')
// @ts-expect-error - bgHover does NOT exist on purple
_testPurpleBg('bgHover')

// Test 5: Border variants
function _testRedBorder(_v: AccentBorderVariant<'red'>): void { /* noop */ }
_testRedBorder('border')
_testRedBorder('borderStrong')
// @ts-expect-error - borderBadge does NOT exist on red
_testRedBorder('borderBadge')
