# Color Theming Centralization Plan

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
- **Solution**: Add `bg.tooltip` to themeTokens ✅ (COMPLETED)

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

## Implementation Status

### ✅ Phase 1: Extend Theme System (COMPLETED)
- ✅ Added `bg.tooltip` to `themeTokens.ts`
- ✅ Updated `useThemeBgColor` hook to support `tooltip` variant
- ✅ All accent colors have proper variants

### ✅ Phase 2: Fix Decrypt Components (COMPLETED)
- ✅ ExtractedData.tsx
- ✅ DecodingAnimation.tsx
- ✅ EncryptedPayload.tsx
- ✅ DecryptError.tsx
- ✅ TemplateIdentification.tsx
- ✅ SignatureVerification.tsx
- ✅ TransactionMetadata.tsx
- ✅ DecryptInput.tsx
- ✅ DecodedResult.tsx

### ✅ Phase 3: Fix Composer Components (COMPLETED)
- ✅ TargetAddressInput.tsx
- ✅ VariableForm.tsx
- ✅ NetworkSelector.tsx
- ✅ SendActions.tsx
- ✅ MessagePreview.tsx

### ✅ Phase 4: Fix Feed & Misc Components (COMPLETED)
- ✅ MessageFeed.tsx
- ✅ App.tsx (spinners)
- ✅ ErrorBoundary.tsx
- ✅ BatchSigner.tsx
- ✅ EncryptionControls.tsx
- ✅ ChainSummary.tsx
- ✅ MessageEditor.tsx
- ✅ BatchRowTable.tsx
- ✅ CSVInput.tsx

### ✅ Phase 5: Verification (COMPLETED)
- ✅ Run grep to find any remaining hardcoded colors
- ✅ All hardcoded colors replaced with theme system

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
- `bg="gray.800"` (tooltip) → `useThemeBgColor('tooltip')` ✅

## Large Components Analysis

### Components > 500 Lines (Consider Breaking Apart)
1. **MessageFeed.tsx** - 643 lines
   - Contains CalloutCard component (could be extracted)
   - Contains search/filter logic (could be extracted)
   - Contains pagination logic (could be extracted)

2. **MessageComposer.tsx** - 571 lines
   - Contains template selection logic
   - Contains variable form logic
   - Contains send/sign actions
   - Could be split into: TemplateSection, VariableSection, ActionSection

3. **ExtractedData.tsx** - 552 lines
   - Contains DataRow component (already extracted)
   - Contains complex recovery amount calculations
   - Contains transfer trace display
   - Could split: RecoverySteps, TransferTrace, AddressList

## Notes
- Some colors might be intentionally hardcoded (e.g., WalletButton gradients) - verify before changing
- Always test components after changes
- Maintain semantic meaning (error = red, success = green, etc.)
