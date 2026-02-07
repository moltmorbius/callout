import { Box, Table, Thead, Tbody, Tr, Th, Td, Code, Text, HStack, IconButton } from '@chakra-ui/react'
import { Icon } from '@iconify/react'
import { useAccentTextColor, useAccentBgColor } from '../../shared/useThemeColors'
import { type BatchRow } from './types'

interface BatchRowTableProps {
  rows: BatchRow[]
  selectedRowIndex: number | null
  onRowSelect: (index: number) => void
  onClearSignature: (index: number) => void
  onClearError: (index: number) => void
  onClearSending: (index: number) => void
}

export function BatchRowTable({ rows, selectedRowIndex, onRowSelect, onClearSignature, onClearError, onClearSending }: BatchRowTableProps) {
  const purpleBgSelected = useAccentBgColor('purple', 'bgMeta')
  const purpleBgHover = useAccentBgColor('purple', 'bgBadge')
  const purpleText = useAccentTextColor('purple')

  return (
    <Box
      overflowX="auto"
      className="custom-scrollbar"
    >
      <Table size="sm" variant="simple" w="100%">
        <Thead>
          <Tr>
            <Th pl={4} pr={1} py={1}>Victim Address</Th>
            <Th px={1} py={1}>Chain ID</Th>
            <Th px={1} py={1}>Theft TX</Th>
            <Th px={1} py={1}>Exploiter</Th>
            <Th pl={1} pr={4} py={1}>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, i) => (
            <Tr
              key={i}
              cursor="pointer"
              bg={selectedRowIndex === i ? purpleBgSelected : undefined}
              _hover={{ bg: purpleBgHover }}
              onClick={() => onRowSelect(i)}
            >
              <Td pl={4} pr={1} py={1}>
                <Code fontSize="xs" bg="transparent">{row.address.slice(0, 10)}...</Code>
              </Td>
              <Td px={1} py={1}>
                <Text fontSize="xs">{row.chainId}</Text>
              </Td>
              <Td px={1} py={1}>
                <Code fontSize="xs" bg="transparent">{row.theftTxHash.slice(0, 10)}...</Code>
              </Td>
              <Td px={1} py={1}>
                <Code fontSize="xs" bg="transparent">{row.scammer.slice(0, 10)}...</Code>
              </Td>
              <Td pl={1} pr={4} py={1}>
                <HStack spacing={2}>
                  <Text fontSize="xs" color={
                    row.status === 'sent' ? 'green.400' :
                    row.status === 'error' ? 'red.400' :
                    row.status === 'sending' ? 'orange.400' :
                    'yellow.400'
                  }>
                    {row.status}
                  </Text>
                  {row.message && (
                    <Text fontSize="xs" color={purpleText} title="Custom message">
                      ✏️
                    </Text>
                  )}
                  {row.status === 'signed' && (
                    <IconButton
                      aria-label="Clear signature"
                      icon={<Icon icon="mdi:close" width="14px" height="14px" />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearSignature(i)
                      }}
                      minW="auto"
                      h="auto"
                      p={0}
                    />
                  )}
                  {row.status === 'error' && (
                    <IconButton
                      aria-label="Reset error"
                      icon={<Icon icon="mdi:close" width="14px" height="14px" />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearError(i)
                      }}
                      minW="auto"
                      h="auto"
                      p={0}
                    />
                  )}
                  {row.status === 'sending' && (
                    <IconButton
                      aria-label="Cancel sending"
                      icon={<Icon icon="mdi:close" width="14px" height="14px" />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearSending(i)
                      }}
                      minW="auto"
                      h="auto"
                      p={0}
                    />
                  )}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
