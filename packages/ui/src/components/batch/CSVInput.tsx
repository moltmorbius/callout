import { VStack, HStack, Text, Button } from '@chakra-ui/react'
import { useThemeTextColor, useAccentTextColor, useAccentBorderColor } from '../../shared/useThemeColors'
import { ThemedTextarea } from '../../shared/ThemedTextarea'

interface CSVInputProps {
  csvText: string
  onCsvTextChange: (text: string) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onParse: () => void
}

export function CSVInput({ csvText, onCsvTextChange, onFileUpload, onParse }: CSVInputProps) {
  const textVeryMuted = useThemeTextColor('veryMuted')
  const purpleBorder = useAccentBorderColor('purple', 'borderFocus')
  const purpleTextLight = useAccentTextColor('purpleLight')

  return (
    <VStack align="stretch" spacing={3}>
      <HStack spacing={3} justifyContent="space-between">
      <Text fontSize="xs" fontWeight="700" color={purpleTextLight}>
        📥 Import CSV Data:
      </Text>

      <HStack spacing={3}>
        <input
          type="file"
          accept=".csv"
          onChange={onFileUpload}
          style={{ display: 'none' }}
          id="csv-upload"
        />
        <Text fontSize="xs" color={textVeryMuted}>paste below:</Text>
        <Text fontSize="xs" color={textVeryMuted}>or</Text>
        <Button
          as="label"
          htmlFor="csv-upload"
          size="sm"
          colorScheme="purple"
          cursor="pointer"
        >
          📂 Upload Csv
        </Button>
      </HStack>
      </HStack>

      <VStack align="stretch" spacing={0}>
        <ThemedTextarea
          value={csvText}
          onChange={(e) => onCsvTextChange((e.target as HTMLDivElement & { value: string }).value)}
          placeholder="victim_private_key,chain_id,tx_hash,exploiter_address&#10;0x123abc...,1,0xdef456...,0x789ghi..."
          size="xs"
          monospace
          minH="120px"
          whiteSpace="pre"
          wordBreak="unset"
        />
        <Button
          size="sm"
          colorScheme="purple"
          onClick={onParse}
          boxShadow={`0 0 0 1px ${purpleBorder}`}
          isDisabled={!csvText.trim()}
        >
          ✨ Parse CSV
        </Button>
      </VStack>
    </VStack>
  )
}
