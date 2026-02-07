import { Box, VStack, Text } from '@chakra-ui/react'
import { useCardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'
import { borderRadius } from '../config/themeTokens'
import { useThemeTextColor, useAccentTextColor, useAccentBgColor, useAccentBorderColor, usePurpleMetaColors } from '../shared/useThemeColors'
import { TemplateSelector } from './TemplateSelector'
import type { MessageTemplate } from '@callout/shared/templates'
import { CSVInput } from './batch/CSVInput'
import { BatchRowTable } from './batch/BatchRowTable'
import { MessageEditor } from './batch/MessageEditor'
import { ChainSummary } from './batch/ChainSummary'
import { BatchActions } from './batch/BatchActions'
import { useBatchSigner } from './batch/useBatchSigner'

export function BatchSigner() {
  const cardStyle = useCardStyle(false) // No padding - we'll add it selectively
  const textMuted = useThemeTextColor('muted')
  const textExtraMuted = useThemeTextColor('extraMuted')
  const purpleMeta = usePurpleMetaColors()
  const purpleText = useThemeTextColor('label')
  const purpleAccentText = useAccentTextColor('purple')
  const greenTextLight = useAccentTextColor('greenLight')

  const {
    csvText,
    setCsvText,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedRowIndex,
    setSelectedRowIndex,
    rows,
    processing,
    isConnected,
    currentChainId,
    handleFileUpload,
    handlePasteCSV,
    getRawTemplate,
    getFinalMessage,
    handleSignAll,
    handleSendAll,
    updateRowMessage,
    resetRowMessage,
    clearSignature,
    clearError,
    clearSending,
    getCalldataForRow,
    recoverAddressFromSignature,
  } = useBatchSigner()

  const selectedRow = selectedRowIndex !== null ? rows[selectedRowIndex] : null
  // Get the template string - prefer row.message if it's a template, otherwise get raw template
  const selectedRowTemplate = selectedRow
    ? (selectedRow.message && selectedRow.message.includes('${')
        ? selectedRow.message
        : getRawTemplate(selectedRow.templateId))
    : ''
  // Get interpolated message for copy button - use centralized function
  const selectedRowMessage = selectedRow ? getFinalMessage(selectedRow) : ''

  return (
    <Box {...cardStyle}>
      <VStack align="stretch" spacing={4} pt={4}>
        <Box px={4}>
          <SectionLabel icon="📊" label="Batch Signer" accent={purpleAccentText} />
        </Box>

        <VStack align="stretch" spacing={3} px={4}>
          <Text fontSize="sm" color={textMuted} lineHeight="1.7">
            Upload a CSV with compromised private keys. Sign messages proving ownership, then send all callouts from your <Text as="span" color={greenTextLight} fontWeight="600">secure connected wallet</Text>.
          </Text>
        </VStack>

        <Box
          px={4}
          py={3}
          bg={purpleMeta.bg}
          borderRadius={borderRadius.none}
          border="none"
          boxShadow={purpleMeta.borderShadow}
        >
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="700" color={purpleText}>
              🔐 How it works:
            </Text>
            <Text fontSize="xs" color={textExtraMuted} lineHeight="1.6">
              1. Each row signs a message with the <Text as="span" fontWeight="600">victim's compromised</Text> private key<br/>
              2. Victim address is automatically derived from the private key<br/>
              3. This proves you have access to that private key (possession, not timing)<br/>
              4. All callouts are sent from your <Text as="span" fontWeight="600">secure</Text> wallet (the one you connect)
            </Text>
          </VStack>
        </Box>

        <Box px={4}>
          <CSVInput
            csvText={csvText}
            onCsvTextChange={setCsvText}
            onFileUpload={handleFileUpload}
            onParse={handlePasteCSV}
          />
        </Box>

        {/* Template Selection */}
        {rows.length > 0 && (
          <VStack align="stretch" spacing={2} px={4}>
            <SectionLabel icon="📝" label="Message Template" accent="purple.300" />
            <TemplateSelector
              onTemplateSelect={(template: MessageTemplate) => {
                setSelectedTemplateId(template.id)
                // Auto-select category when template is selected
                setSelectedCategoryId(template.categoryId)
              }}
              selectedTemplateId={selectedTemplateId}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={setSelectedCategoryId}
            />
            <Text fontSize="xs" color={textExtraMuted} mt={4}>
              Click a row below to preview and edit the message for that address
            </Text>
          </VStack>
        )}

        {rows.length > 0 && (
          <VStack align="stretch" spacing={0}>
            <BatchRowTable
              rows={rows}
              selectedRowIndex={selectedRowIndex}
              onRowSelect={setSelectedRowIndex}
              onClearSignature={clearSignature}
              onClearError={clearError}
              onClearSending={clearSending}
            />
            {selectedRow && selectedRowIndex !== null && (
              <MessageEditor
                row={selectedRow}
                rowIndex={selectedRowIndex}
                templateString={selectedRowTemplate}
                interpolatedMessage={selectedRowMessage}
                onMessageChange={(message) => updateRowMessage(selectedRowIndex, message)}
                onReset={() => resetRowMessage(selectedRowIndex)}
                onClose={() => setSelectedRowIndex(null)}
              />
            )}
            {isConnected && (
              <ChainSummary
                rows={rows}
                currentChainId={currentChainId}
                processing={processing}
              />
            )}
          </VStack>
        )}

        {rows.length > 0 && (
          <BatchActions
            rows={rows}
            isConnected={isConnected}
            processing={processing}
            onSignAll={handleSignAll}
            onSendAll={handleSendAll}
            getCalldataForRow={getCalldataForRow}
            recoverAddressFromSignature={recoverAddressFromSignature}
          />
        )}
      </VStack>
    </Box>
  )
}
