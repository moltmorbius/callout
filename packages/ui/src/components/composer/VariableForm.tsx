import { Box, VStack, HStack, Text, Input } from '@chakra-ui/react'
import { validateVariable, getVariableProgress, type MessageTemplate } from '../../utils/templateEngine'
import { borderRadius, boxShadows, getThemeValue } from '../../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { useThemeTextColor, useThemeBgColor, useCategoryColors, useAccentTextColor } from '../../shared/useThemeColors'
import { templateCategories } from '../../config/templates'

interface VariableFormProps {
  template: MessageTemplate
  variableValues: Record<string, string>
  onVariableChange: (key: string, value: string) => void
  selectedCategoryId: string | null
}

/**
 * Form component for editing template variables with validation and progress tracking.
 */
export function VariableForm({ template, variableValues, onVariableChange, selectedCategoryId }: VariableFormProps) {
  const inputBg = useThemeBgColor('input')
  const inputText = useThemeTextColor('primary')
  const inputPlaceholder = useThemeTextColor('extraMuted')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const textMuted = useThemeTextColor('muted')
  const inputBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderInput, 'light'),
    getThemeValue(boxShadows.borderInput, 'dark')
  )
  const whiteHoverShadow = useColorModeValue(
    '0 0 0 1px rgba(255, 255, 255, 0.2)',
    '0 0 0 1px rgba(255, 255, 255, 0.2)'
  )
  const progressBarBg = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)')
  const calendarFilter = useColorModeValue('none', 'invert(1)')

  // Get active category colors
  const activeCategory = selectedCategoryId
    ? templateCategories.find((c) => c.id === selectedCategoryId)
    : null

  const greenColors = useCategoryColors('green')
  const yellowColors = useCategoryColors('yellow')
  const redColors = useCategoryColors('red')
  const orangeColors = useCategoryColors('orange')
  const purpleColors = useCategoryColors('purple')

  const categoryColorsMap = {
    green: greenColors,
    yellow: yellowColors,
    red: redColors,
    orange: orangeColors,
    purple: purpleColors,
  }

  const activeColors = activeCategory
    ? categoryColorsMap[activeCategory.color as keyof typeof categoryColorsMap] || redColors
    : null

  const { filled, total } = getVariableProgress(template, variableValues)
  const greenText = useAccentTextColor('green')
  const orangeText = useAccentTextColor('orange')

  return (
    <>
      {/* Variable form fields */}
      <VStack spacing={3} align="stretch" mb={4}>
        {template.variables.map((variable) => {
          const value = variableValues[variable.key] || ''
          const error = value ? validateVariable(variable, value) : null
          const isFilled = value.trim().length > 0
          const isAddr = variable.type === 'address'
          const isDeadline = variable.key === 'deadline'

          return (
            <Box key={variable.key}>
              <HStack mb={1.5} spacing={2}>
                <Text fontSize="11px" fontWeight="700" letterSpacing="0.06em"
                  textTransform="uppercase" color={textVeryMuted}>
                  {variable.label}
                  {variable.optional && (
                    <Text as="span" fontSize="10px" ml={1} color={textExtraMuted} fontWeight="500">
                      (optional)
                    </Text>
                  )}
                </Text>
                {isFilled && !error && (
                  <Box w="6px" h="6px" borderRadius="full" bg={greenText} />
                )}
                {error && (
                  <Text fontSize="10px" color={orangeText} fontWeight="600">{error}</Text>
                )}
              </HStack>
              {isDeadline ? (
                <Input
                  type="datetime-local"
                  value={value}
                  onChange={(e) => onVariableChange(variable.key, e.target.value)}
                  aria-label={variable.label}
                  fontSize="sm"
                  bg={inputBg}
                  color={inputText}
                  h="46px"
                  border="none"
                  boxShadow={error ? '0 0 0 1px var(--chakra-colors-orange-500)' : isFilled ? (activeColors?.border ? `0 0 0 1px ${activeColors.border}` : inputBorderShadow) : inputBorderShadow}
                  borderRadius={borderRadius.none}
                  _hover={{ boxShadow: whiteHoverShadow }}
                  _focus={{
                    boxShadow: activeColors?.border ? `0 0 0 1px ${activeColors.border}` : inputBorderShadow,
                  }}
                  sx={{
                    '::-webkit-calendar-picker-indicator': {
                      filter: calendarFilter,
                      cursor: 'pointer',
                    }
                  }}
                />
              ) : (
                <Input
                  placeholder={variable.placeholder}
                  value={value}
                  onChange={(e) => onVariableChange(variable.key, e.target.value)}
                  aria-label={variable.label}
                  fontFamily={isAddr ? 'mono' : 'body'}
                  fontSize="sm"
                  bg={inputBg}
                  color={inputText}
                  h="46px"
                  border="none"
                  boxShadow={error ? '0 0 0 1px var(--chakra-colors-orange-500)' : isFilled ? (activeColors?.border ? `0 0 0 1px ${activeColors.border}` : inputBorderShadow) : inputBorderShadow}
                  borderRadius={borderRadius.none}
                  _hover={{ boxShadow: whiteHoverShadow }}
                  _focus={{
                    boxShadow: activeColors?.border ? `0 0 0 1px ${activeColors.border}` : inputBorderShadow,
                  }}
                  _placeholder={{ color: inputPlaceholder }}
                />
              )}
            </Box>
          )
        })}
      </VStack>

      {/* Progress indicator */}
      {template.variables.length > 0 && (
        <HStack mb={3} spacing={2}>
          <Box flex={1} h="3px" borderRadius="full" bg={progressBarBg} overflow="hidden">
            <Box
              h="full" borderRadius="full"
              bg={filled === total ? 'green.400' : (activeColors?.text || 'whiteAlpha.300')}
              w={`${(filled / total) * 100}%`}
              transition="width 0.1s ease"
            />
          </Box>
          <Text fontSize="10px" color={textMuted} fontWeight="600">
            {filled}/{total}
          </Text>
        </HStack>
      )}
    </>
  )
}
