import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react'
import { useState, useMemo } from 'react'
import {
  templateCategories,
  getTemplatesByCategory,
  type TemplateCategoryId,
  type MessageTemplate,
} from '../config/templates'
import { borderRadius, boxShadows, getThemeValue } from '../config/themeTokens'
import { useThemeTextColor, useThemeBgColor, useCategoryColors, useAccentBgColor } from '../shared/useThemeColors'

interface TemplateSelectorProps {
  /** Callback when a template is selected */
  onTemplateSelect: (template: MessageTemplate) => void
  /** Optional: pre-selected template ID */
  selectedTemplateId?: string
  /** Optional: pre-selected category ID (for persistence) */
  selectedCategoryId?: TemplateCategoryId | null
  /** Optional: callback when category is selected */
  onCategorySelect?: (categoryId: TemplateCategoryId | null) => void
  /** Optional: show custom message option */
  showCustom?: boolean
  /** Optional: callback for custom message option */
  onCustomSelect?: () => void
}

/**
 * Reusable template selector component that matches the UI from MessageComposer.
 * Shows category cards first, then template cards after category selection.
 */
export function TemplateSelector({
  onTemplateSelect,
  selectedTemplateId,
  selectedCategoryId: propSelectedCategoryId,
  onCategorySelect,
  showCustom = false,
  onCustomSelect,
}: TemplateSelectorProps) {
  // Use prop if provided, otherwise manage internally
  const [internalCategoryId, setInternalCategoryId] = useState<TemplateCategoryId | null>(null)
  const selectedCategoryId = propSelectedCategoryId !== undefined ? propSelectedCategoryId : internalCategoryId

  const handleCategorySelect = (categoryId: TemplateCategoryId) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId)
    } else {
      setInternalCategoryId(categoryId)
    }
  }

  const handleBackToCategories = () => {
    if (onCategorySelect) {
      onCategorySelect(null)
    } else {
      setInternalCategoryId(null)
    }
  }
  const cardBg = useThemeBgColor('card')
  const textMuted = useThemeTextColor('muted')
  const textVeryMuted = useThemeTextColor('veryMuted')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const cardBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )
  const dashedBorderShadow = useColorModeValue(
    '0 0 0 1px dashed rgba(0, 0, 0, 0.15)',
    '0 0 0 1px dashed rgba(255, 255, 255, 0.1)'
  )
  const purpleBgHover = useAccentBgColor('purple', 'bgBadge')
  const greenTextLight = useColorModeValue('green.600', 'green.300')
  const yellowTextLight = useColorModeValue('yellow.700', 'yellow.300')
  const redTextLight = useColorModeValue('red.600', 'red.300')
  const orangeTextLight = useColorModeValue('orange.600', 'orange.300')
  const purpleTextLight = useColorModeValue('purple.600', 'purple.300')
  const blueTextLight = useColorModeValue('blue.600', 'blue.300')

  // Pre-compute all category colors using hooks (hooks can't be called in loops)
  const greenColors = useCategoryColors('green')
  const yellowColors = useCategoryColors('yellow')
  const redColors = useCategoryColors('red')
  const orangeColors = useCategoryColors('orange')
  const purpleColors = useCategoryColors('purple')
  const blueColors = useCategoryColors('blue')

  const categoryColorsMap = useMemo(() => ({
    green: greenColors,
    yellow: yellowColors,
    red: redColors,
    orange: orangeColors,
    purple: purpleColors,
    blue: blueColors,
  }), [greenColors, yellowColors, redColors, orangeColors, purpleColors, blueColors])

  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null
    return templateCategories.find(cat => cat.id === selectedCategoryId) || null
  }, [selectedCategoryId])

  const activeColors = useMemo(() => {
    if (!activeCategory) return null
    return categoryColorsMap[activeCategory.color as keyof typeof categoryColorsMap] || redColors
  }, [activeCategory, categoryColorsMap, redColors])

  const categoryTemplates = useMemo(() => {
    if (!selectedCategoryId) return []
    return getTemplatesByCategory(selectedCategoryId)
  }, [selectedCategoryId])


  const handleTemplateSelect = (template: MessageTemplate) => {
    onTemplateSelect(template)
  }

  // ── STEP 1: Category selector (shown when no category selected) ──
  if (!selectedCategoryId) {
    return (
      <>
        <Text fontSize="xs" color={textMuted} mb={4} lineHeight="1.5">
          Choose a category for your on-chain message{showCustom ? ', or write a custom one' : ''}.
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mb={showCustom ? 4 : 0}>
          {templateCategories.map((cat) => {
            const colors = categoryColorsMap[cat.color as keyof typeof categoryColorsMap] || redColors
            return (
              <Box
                key={cat.id}
                p={4}
                borderRadius={borderRadius.none}
                bg={cardBg}
                border="none"
                boxShadow={cardBorderShadow}
                cursor="pointer"
                transition="all 0.1s ease"
                textAlign="center"
                _hover={{
                  boxShadow: `0 0 0 2px ${colors.border}`,
                  bg: colors.bgHover,
                  transform: 'translateY(-2px)',
                }}
                _active={{ transform: 'translateY(0)' }}
                onClick={() => handleCategorySelect(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCategorySelect(cat.id)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${cat.name}: ${cat.description}`}
              >
                <Box
                  w="48px"
                  h="48px"
                  borderRadius={0}
                  bg={colors.iconBg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={3}
                  boxShadow={cardBorderShadow}
                >
                  <Text fontSize="xl">{cat.emoji}</Text>
                </Box>
                <Badge
                  colorScheme={colors.badge}
                  variant="solid"
                  fontSize="10px"
                  fontWeight="800"
                  letterSpacing="0.08em"
                  borderRadius={0}
                  px={3}
                  py={0.5}
                  mb={2}
                >
                  {cat.name}
                </Badge>
                <Text fontSize="11px" color={textMuted} lineHeight="1.4" mt={1}>
                  {cat.description}
                </Text>
              </Box>
            )
          })}
        </SimpleGrid>

        {/* Custom message option */}
        {showCustom && onCustomSelect && (
          <Box
            p={4}
            borderRadius={borderRadius.none}
            bg={cardBg}
            border="none"
            boxShadow={dashedBorderShadow}
            cursor="pointer"
            transition="all 0.1s ease"
            _hover={{
              boxShadow: useColorModeValue(
                getThemeValue(boxShadows.borderDashedHover, 'light'),
                getThemeValue(boxShadows.borderDashedHover, 'dark')
              ),
              bg: purpleBgHover,
            }}
            onClick={onCustomSelect}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCustomSelect()
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Write a custom message"
          >
            <HStack spacing={2} justify="center">
              <Text fontSize="lg">✍️</Text>
              <Badge
                colorScheme="purple"
                variant="solid"
                fontSize="10px"
                fontWeight="800"
                letterSpacing="0.05em"
                borderRadius={0}
                px={2.5}
                py={0.5}
              >
                Custom
              </Badge>
              <Text fontSize="xs" color={textMuted} fontWeight="500">
                Write your own message
              </Text>
            </HStack>
          </Box>
        )}
      </>
    )
  }

  // ── STEP 2: Template picker (shown when category selected) ──
  return (
    <>
      <HStack mb={2} spacing={2}>
        <Box
          as="button"
          fontSize="xs"
          color={textVeryMuted}
          fontWeight="700"
          letterSpacing="0.05em"
          cursor="pointer"
          transition="color 0.1s"
          _hover={{ color: textMuted }}
          onClick={handleBackToCategories}
        >
          ← Categories
        </Box>
        {activeCategory && (
          <>
            <Text fontSize="xs" color={textExtraMuted}>/</Text>
            <Badge
              colorScheme={activeColors?.badge || 'gray'}
              variant="subtle"
              fontSize="10px"
              borderRadius={0}
              px={2}
            >
              {activeCategory.emoji} {activeCategory.name}
            </Badge>
          </>
        )}
      </HStack>

      <Text fontSize="xs" color={textMuted} mb={2} lineHeight="1.5">
        Select a template to customize:
      </Text>

      <VStack spacing={2} align="stretch">
        {categoryTemplates.map((tpl) => {
          const colors = activeColors || redColors
          const isSelected = selectedTemplateId === tpl.id
          return (
            <Box
              key={tpl.id}
              borderRadius={borderRadius.none}
              bg={isSelected ? colors.bgHover : cardBg}
              border="none"
              boxShadow={
                isSelected
                  ? `0 0 0 1.5px ${colors.border}`
                  : cardBorderShadow
              }
              cursor="pointer"
              transition="all 0.1s ease"
              _hover={{
                boxShadow: `0 0 0 1.5px ${colors.border}`,
                bg: colors.bgHover,
                transform: 'translateX(4px)',
              }}
              onClick={() => handleTemplateSelect(tpl)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTemplateSelect(tpl)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <HStack spacing={2} align="flex-start">
                <Box
                  w="36px"
                  h="36px"
                  borderRadius={0}
                  bg={colors.iconBg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  boxShadow={cardBorderShadow}
                >
                  <Text fontSize="lg">{tpl.emoji}</Text>
                </Box>
                <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                  <HStack spacing={2} flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="700" color={
                      colors.text === 'green.300' ? greenTextLight :
                      colors.text === 'yellow.300' ? yellowTextLight :
                      colors.text === 'red.300' ? redTextLight :
                      colors.text === 'orange.300' ? orangeTextLight :
                      colors.text === 'purple.300' ? purpleTextLight :
                      colors.text === 'blue.300' ? blueTextLight :
                      colors.text
                    }>
                      {tpl.name}
                    </Text>
                  </HStack>
                  <Text fontSize="11px" color={textVeryMuted} lineHeight="1.4">
                    {tpl.description}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )
        })}
      </VStack>
    </>
  )
}
