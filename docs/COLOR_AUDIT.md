# Color Theming Audit & Centralization Plan

## Overview
This document outlines the audit findings and plan to centralize all hardcoded colors in the codebase.

## Current State

### Existing Theme System
- **Location**: `src/config/themeTokens.ts`
- **Hooks**: `src/shared/useThemeColors.ts`
- **Status**: Good foundation exists, but many components still use hardcoded colors

### Patterns Found

#### 1. Background Colors (Most Common)
**Pattern**: `bg="white"` + `_dark={{ bg: 'gray.900' }}`
- **Files**: 7 decrypt components, MessageFeed, NetworkSelector
- **Solution**: Use `useThemeBgColor('card')`

#### 2. Accent Text Colors
**Pattern**: Direct Chakra tokens like `color="blue.300"`, `color="green.300"`, etc.
- **Files**: ExtractedData, DecodedResult, SignatureVerification, TemplateIdentification, TransactionMetadata, DecryptInput, MessageFeed, SendActions, TargetAddressInput, VariableForm, EncryptionControls, BatchSigner, CSVInput, MessagePreview, ErrorBoundary, ChainSummary, MessageEditor, BatchRowTable
- **Solution**: Use `getAccentTextColor('blueLight')`, `getAccentTextColor('greenLight')`, etc.

#### 3. Status Colors
**Pattern**: `color="red.400"`, `color="green.400"`, `color="orange.400"`, `color="yellow.300"`
- **Files**: Multiple components
- **Solution**: Use `getStatusTextColor('error')`, `getStatusTextColor('success')`, `getStatusTextColor('warning')`, or `getAccentTextColor()` for accent variants

#### 4. Tooltip Backgrounds
**Pattern**: `bg="gray.800"`
- **Files**: MessageFeed
- **Solution**: Add `bg.tooltip` to themeTokens

#### 5. Indicator Dots
**Pattern**: `bg="red.400"`, `bg="green.400"` (small 6px dots)
- **Files**: TargetAddressInput, VariableForm, EncryptionControls
- **Solution**: Use `getAccentTextColor()` or `getStatusTextColor()`

#### 6. Spinner Colors
**Pattern**: `color="blue.300"`, `color="green.300"`, `color="purple.300"`, `color="red.400"`
- **Files**: App.tsx, MessageFeed, EncryptionControls
- **Solution**: Use `getAccentTextColor()` or `getStatusTextColor()`

#### 7. Hover States
**Pattern**: `_hover={{ color: 'green.300', bg: 'green.50', _dark: { bg: 'green.900' } }}`
- **Files**: ExtractedData
- **Solution**: Use accent background colors from theme

## Detailed File Inventory

### Decrypt Components (High Priority)
1. **ExtractedData.tsx**
   - `bg="white"` + `_dark={{ bg: 'gray.900' }}` → `useThemeBgColor('card')`
   - `color="blue.300"` (multiple) → `getAccentTextColor('blueLight')`
   - `color="green.300"` (multiple) → `getAccentTextColor('greenLight')`
   - `color="red.300"` → `getAccentTextColor('redLight')`
   - `color="green.400"` → `getAccentTextColor('green')`
   - `_hover={{ color: 'green.300', bg: 'green.50', _dark: { bg: 'green.900' } }}` → Use theme colors

2. **DecodingAnimation.tsx**
   - `bg="white"` + `_dark={{ bg: 'gray.900' }}` → `useThemeBgColor('card')`
   - `color="blue.300"` → `getAccentTextColor('blueLight')`

3. **EncryptedPayload.tsx**
   - `bg="white"` + `_dark={{ bg: 'gray.900' }}` → `useThemeBgColor('card')`
   - `color="yellow.300"` → `getAccentTextColor('yellow')`

4. **DecryptError.tsx**
   - `bg="white"` + `_dark={{ bg: 'gray.900' }}` → `useThemeBgColor('card')`
   - Already uses `useColorModeValue` for text colors (good)

5. **TemplateIdentification.tsx**
   - `bg="white"` + `_dark={{ bg: 'gray.900' }}` → `useThemeBgColor('card')`
   - `color="purple.300"` → `getAccentTextColor('purpleLight')`

6. **SignatureVerification.tsx**
   - `bg="white"` + `_dark={{ bg: 'gray.900' }}` → `useThemeBgColor('card')`
   - `color="green.300"` (multiple) → `getAccentTextColor('greenLight')`

7. **TransactionMetadata.tsx**
   - `bg="white"` + `_dark={{ bg: 'gray.900' }}` → `useThemeBgColor('card')`
   - `color="purple.300"` (multiple) → `getAccentTextColor('purpleLight')`

8. **DecryptInput.tsx**
   - `color="blue.300"` → `getAccentTextColor('blueLight')`

9. **DecodedResult.tsx**
   - `color="green.300"` → `getAccentTextColor('greenLight')`

### Composer Components
1. **TargetAddressInput.tsx**
   - `bg="red.400"` (indicator dot) → `getAccentTextColor('red')`
   - `color="red.500"` → `getAccentTextColor('red')` or `getStatusTextColor('error')`
   - `color="purple.400"`, `color="purple.300"` → `getAccentTextColor('purple')` / `getAccentTextColor('purpleLight')`
   - `color="green.400"` → `getAccentTextColor('green')`
   - `color="orange.400"` → `getAccentTextColor('orange')`
   - `color="red.400"` → `getAccentTextColor('red')`

2. **VariableForm.tsx**
   - `bg="green.400"` (indicator dot) → `getAccentTextColor('green')`
   - `color="orange.400"` → `getAccentTextColor('orange')`

3. **NetworkSelector.tsx**
   - `bg="gray.900"` → Need to add `bg.tooltip` or similar

4. **SendActions.tsx**
   - `color="purple.300"`, `color="purple.400"` → `getAccentTextColor('purpleLight')` / `getAccentTextColor('purple')`
   - `color="green.400"`, `color="green.300"` → `getAccentTextColor('green')` / `getAccentTextColor('greenLight')`

5. **MessagePreview.tsx**
   - `color="green.400"` → `getAccentTextColor('green')`

### Feed & Other Components
1. **MessageFeed.tsx**
   - `bg="gray.800"` (tooltip) → Add `bg.tooltip` to themeTokens
   - `color="red.400"`, `color="red.300"` → `getAccentTextColor('red')` / `getAccentTextColor('redLight')`
   - `color="purple.300"` → `getAccentTextColor('purpleLight')`
   - `color="yellow.300"`, `color="yellow.200"` → `getAccentTextColor('yellow')`
   - `color="red.400"` (spinner) → `getAccentTextColor('red')`

2. **App.tsx**
   - `color="blue.300"` (spinner) → `getAccentTextColor('blueLight')`
   - `color="green.300"` (spinner) → `getAccentTextColor('greenLight')`
   - `color="purple.300"` (spinner) → `getAccentTextColor('purpleLight')`

3. **ErrorBoundary.tsx**
   - `color="red.300"` → `getAccentTextColor('redLight')`

4. **EncryptionControls.tsx**
   - `bg="green.400"` (indicator dot) → `getAccentTextColor('green')`
   - `color="green.400"` (multiple) → `getAccentTextColor('green')`
   - `color="orange.400"` → `getAccentTextColor('orange')`

5. **BatchSigner.tsx**
   - `color="green.300"` → `getAccentTextColor('greenLight')`

6. **CSVInput.tsx**
   - `color="purple.300"` → `getAccentTextColor('purpleLight')`

7. **ChainSummary.tsx**
   - `color="orange.300"`, `color="orange.400"` → `getAccentTextColor('orangeLight')` / `getAccentTextColor('orange')`
   - `color="green.400"` → `getAccentTextColor('green')`
   - `color="purple.400"` → `getAccentTextColor('purple')`

8. **MessageEditor.tsx**
   - `color="purple.300"` → `getAccentTextColor('purpleLight')`

9. **BatchRowTable.tsx**
   - `color="purple.400"` → `getAccentTextColor('purple')`

## Implementation Plan

### Phase 1: Extend Theme System
1. Add missing background variants to `themeTokens.ts`:
   - `bg.tooltip` (for tooltip backgrounds)
   - `bg.indicator` (if needed, or use accent colors)

2. Ensure all accent colors have proper variants:
   - Verify `orange` has all needed variants
   - Add `yellow` text variants if missing

### Phase 2: Fix Decrypt Components
- Fix all 9 decrypt components systematically
- Test each component after fixing

### Phase 3: Fix Composer Components
- Fix all composer components
- Test composer flow

### Phase 4: Fix Feed & Misc Components
- Fix MessageFeed and remaining components
- Test full application flow

### Phase 5: Verification
- Run grep to find any remaining hardcoded colors
- Document any exceptions (if needed)

## Color Mapping Reference

### Accent Colors → Theme Functions
- `blue.300` → `getAccentTextColor('blueLight')`
- `blue.400` → `getAccentTextColor('blue')`
- `green.300` → `getAccentTextColor('greenLight')`
- `green.400` → `getAccentTextColor('green')`
- `purple.300` → `getAccentTextColor('purpleLight')`
- `purple.400` → `getAccentTextColor('purple')`
- `red.300` → `getAccentTextColor('redLight')`
- `red.400` → `getAccentTextColor('red')`
- `orange.300` → `getAccentTextColor('orangeLight')`
- `orange.400` → `getAccentTextColor('orange')`
- `yellow.300` → `getAccentTextColor('yellow')`

### Status Colors
- `red.400` (error) → `getStatusTextColor('error')`
- `green.400` (success) → `getStatusTextColor('success')`
- `orange.400` (warning) → `getStatusTextColor('warning')`
- `blue.400` (info) → `getStatusTextColor('info')`

### Background Colors
- `bg="white"` + `_dark={{ bg: 'gray.900' }}` → `useThemeBgColor('card')`
- `bg="gray.800"` (tooltip) → `useThemeBgColor('tooltip')` (needs to be added)

## Notes
- Some colors might be intentionally hardcoded (e.g., WalletButton gradients) - verify before changing
- Always test components after changes
- Maintain semantic meaning (error = red, success = green, etc.)
