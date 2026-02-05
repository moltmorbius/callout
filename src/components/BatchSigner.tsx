import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  Textarea,
  Select,
  useToast,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useAccount, useSendTransaction, useChainId, useSwitchChain } from 'wagmi'
import { isAddress, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { cardStyle } from '../shared/styles'
import { SectionLabel } from '../shared/SectionLabel'
import { encodeMessage } from '../utils/encoding'
import { messageTemplates, applyTemplate } from '../config/templates'

interface BatchRow {
  privateKey: string
  address: Address
  chainId: number
  theftTxHash: string
  scammer: Address
  templateId?: string
  message?: string
  signature?: string
  sentTxHash?: string
  status: 'pending' | 'signing' | 'signed' | 'sending' | 'sent' | 'error'
  error?: string
}

export function BatchSigner() {
  const { isConnected } = useAccount()
  const currentChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const toast = useToast()
  const [rows, setRows] = useState<BatchRow[]>([])
  const [processing, setProcessing] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('scam-bounty-simple')
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const { sendTransactionAsync } = useSendTransaction()

  // Parse CSV text into rows
  const parseCSV = useCallback((csv: string) => {
    const lines = csv.trim().split('\n')
    if (lines.length < 2) {
      toast({
        title: 'Invalid CSV',
        description: 'CSV must have at least a header row and one data row',
        status: 'error',
        duration: 5000,
      })
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Required columns (flexible naming)
    const keyIdx = headers.findIndex(h => h === 'victim_private_key' || h === 'private_key' || h === 'key')
    const chainIdx = headers.findIndex(h => h === 'chain_id' || h === 'chain')
    const txIdx = headers.findIndex(h => h === 'tx_hash' || h === 'theft_tx' || h === 'hash')
    const exploiterIdx = headers.findIndex(h => h === 'exploiter_address' || h === 'scammer' || h === 'exploiter')
    
    if (keyIdx === -1 || chainIdx === -1 || txIdx === -1 || exploiterIdx === -1) {
      toast({
        title: 'Invalid CSV',
        description: 'CSV must have: victim_private_key, chain_id, tx_hash, exploiter_address',
        status: 'error',
        duration: 5000,
      })
      return
    }

    const parsed: BatchRow[] = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      
      let privateKey = values[keyIdx]
      
      // Ensure private key has 0x prefix
      if (!privateKey.startsWith('0x')) {
        privateKey = `0x${privateKey}`
      }
      
      try {
        // Derive victim address from private key
        const account = privateKeyToAccount(privateKey as `0x${string}`)
        const victimAddress = account.address
        
        const exploiterAddress = values[exploiterIdx] as Address
        
        if (!isAddress(exploiterAddress)) {
          console.warn(`Invalid exploiter address: ${exploiterAddress}`)
          return null
        }
        
        return {
          privateKey,
          address: victimAddress,
          chainId: parseInt(values[chainIdx]),
          theftTxHash: values[txIdx],
          scammer: exploiterAddress,
          status: 'pending' as const,
        }
      } catch (err) {
        console.error('Invalid private key:', privateKey.slice(0, 10) + '...', err)
        return null
      }
    }).filter((row): row is NonNullable<typeof row> => 
      row !== null && 
      row.address !== undefined &&
      isAddress(row.address) && 
      isAddress(row.scammer)
    ) as BatchRow[]

    setRows(parsed)
    toast({
      title: 'CSV Loaded',
      description: `${parsed.length} rows parsed successfully`,
      status: 'success',
      duration: 3000,
    })
  }, [toast])

  // Parse CSV from file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result as string
      parseCSV(csv)
    }
    reader.readAsText(file)
  }, [parseCSV])

  // Parse CSV from textarea
  const handlePasteCSV = useCallback(() => {
    if (!csvText.trim()) {
      toast({
        title: 'Empty Input',
        description: 'Please paste CSV data first',
        status: 'warning',
        duration: 3000,
      })
      return
    }
    parseCSV(csvText)
  }, [csvText, parseCSV, toast])

  // Generate interpolated message for a row
  const generateMessage = useCallback((row: BatchRow, templateId?: string): string => {
    const template = messageTemplates.find(t => t.id === (templateId || selectedTemplateId))
    if (!template) {
      // Fallback to simple message
      return `PROOF OF OWNERSHIP\n\nI am the legitimate owner of address ${row.address}.\n\nThis address was exploited in transaction:\n${row.theftTxHash}\n\nThe exploiter who controls my address now:\n${row.scammer}\n\nThis message is signed with my private key to prove ownership.\nI am requesting the return of my funds.\n\nSigned on chain ID: ${row.chainId}`
    }

    // Map row data to template variables
    const variables: Record<string, string> = {
      victim_address: row.address,
      exploited_address: row.address, // Legacy alias
      exploiter_address: row.scammer,
      spammer_address: row.scammer, // Legacy alias
      receive_address: row.address, // Default to same address
      // Note: other variables (amount, token_name, etc.) would need to be in CSV or user-provided
    }

    return applyTemplate(template.template, variables, template)
  }, [selectedTemplateId])

  // Sign all messages
  const handleSignAll = useCallback(async () => {
    setProcessing(true)
    const updated = [...rows]

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (row.status !== 'pending') continue

      try {
        // Update status
        row.status = 'signing'
        setRows([...updated])

        // Use pre-edited message or generate from template
        const message = row.message || generateMessage(row, row.templateId)

        // Sign with private key from CSV
        const account = privateKeyToAccount(row.privateKey as `0x${string}`)
        const signature = await account.signMessage({ message })

        // Save signature and message
        row.message = message
        row.signature = signature
        row.status = 'signed'
        setRows([...updated])
      } catch (err: any) {
        console.error('Sign error:', err)
        row.status = 'error'
        row.error = err.message || 'Failed to sign'
        setRows([...updated])
      }
    }

    setProcessing(false)
    toast({
      title: 'Signing Complete',
      description: `Signed ${updated.filter(r => r.status === 'signed').length} messages`,
      status: 'success',
      duration: 3000,
    })
  }, [rows, generateMessage, toast])

  // Send all signed messages
  const handleSendAll = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: 'Connect Wallet',
        description: 'Connect your secure wallet to send callouts',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setProcessing(true)
    const updated = [...rows]

    // Group rows by chain ID
    const chainGroups = new Map<number, typeof updated>()
    for (const row of updated) {
      if (row.status !== 'signed') continue
      const group = chainGroups.get(row.chainId) || []
      group.push(row)
      chainGroups.set(row.chainId, group)
    }

    // Process each chain group
    for (const [chainId, chainRows] of chainGroups) {
      // Check if we need to switch chains
      if (currentChainId !== chainId) {
        try {
          toast({
            title: 'Switching Network',
            description: `Switching to chain ID ${chainId}...`,
            status: 'info',
            duration: 2000,
          })
          await switchChainAsync({ chainId })
        } catch (err: any) {
          console.error('Chain switch error:', err)
          // Mark all rows in this chain as error
          for (const row of chainRows) {
            row.status = 'error'
            row.error = `Chain switch failed: ${err.message || 'User rejected'}`
          }
          setRows([...updated])
          continue // Skip this chain group
        }
      }

      // Send transactions for this chain
      for (const row of chainRows) {
        try {
          // Update status
          row.status = 'sending'
          setRows([...updated])

          // Build callout message: original message + signature proof
          const calldataMessage = `${row.message}\n\n---\nSIGNATURE: ${row.signature}\nSIGNED BY: ${row.address}`

          const calldata = encodeMessage(calldataMessage)

          // Send to scammer from secure wallet (now on correct chain)
          const hash = await sendTransactionAsync({
            to: row.scammer,
            data: calldata,
            value: BigInt(0),
          })

          row.sentTxHash = hash
          row.status = 'sent'
          setRows([...updated])
        } catch (err: any) {
          console.error('Send error:', err)
          row.status = 'error'
          row.error = err.message || 'Failed to send'
          setRows([...updated])
        }
      }
    }

    setProcessing(false)
    toast({
      title: 'Sending Complete',
      description: `Sent ${updated.filter(r => r.status === 'sent').length} callouts`,
      status: 'success',
      duration: 3000,
    })
  }, [rows, isConnected, currentChainId, switchChainAsync, sendTransactionAsync, toast])

  return (
    <Box {...cardStyle}>
      <VStack align="stretch" spacing={6}>
        <SectionLabel icon="📊" label="Batch Signer" accent="purple.400" />

        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" color="whiteAlpha.600" lineHeight="1.7">
            Upload a CSV with compromised private keys. Sign messages proving ownership, then send all callouts from your <Text as="span" color="green.300" fontWeight="600">secure connected wallet</Text>.
          </Text>
          
          <Box p={3} bg="rgba(138, 75, 255, 0.06)" borderRadius="lg" border="1px solid" borderColor="rgba(138, 75, 255, 0.2)">
            <VStack align="start" spacing={2}>
              <Text fontSize="xs" fontWeight="700" color="purple.300">
                🔐 How it works:
              </Text>
              <Text fontSize="xs" color="whiteAlpha.500" lineHeight="1.6">
                1. Each row signs a message with the <Text as="span" fontWeight="600">victim's compromised</Text> private key<br/>
                2. Victim address is automatically derived from the private key<br/>
                3. This proves you have access to that private key (possession, not timing)<br/>
                4. All callouts are sent from your <Text as="span" fontWeight="600">secure</Text> wallet (the one you connect)
              </Text>
            </VStack>
          </Box>
        </VStack>

        {/* CSV Input */}
        <VStack align="stretch" spacing={3}>
          <Text fontSize="xs" fontWeight="700" color="purple.300">
            📥 Import CSV Data:
          </Text>
          
          <HStack spacing={3}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <Button
              as="label"
              htmlFor="csv-upload"
              size="sm"
              colorScheme="purple"
              cursor="pointer"
            >
              📂 Upload File
            </Button>
            <Text fontSize="xs" color="whiteAlpha.400">or</Text>
            <Text fontSize="xs" color="whiteAlpha.400">paste below:</Text>
          </HStack>

          <VStack align="stretch" spacing={2}>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="victim_private_key,chain_id,tx_hash,exploiter_address&#10;0x123abc...,1,0xdef456...,0x789ghi..."
              fontSize="xs"
              fontFamily="monospace"
              minH="120px"
              bg="rgba(6, 6, 15, 0.5)"
              borderColor="whiteAlpha.200"
              _hover={{ borderColor: 'purple.400' }}
              _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
            />
            <Button
              size="sm"
              colorScheme="purple"
              onClick={handlePasteCSV}
              isDisabled={!csvText.trim()}
            >
              ✨ Parse CSV
            </Button>
          </VStack>
        </VStack>

        {/* Template Selection */}
        {rows.length > 0 && (
          <VStack align="stretch" spacing={3}>
            <Text fontSize="xs" fontWeight="700" color="purple.300">
              📝 Message Template:
            </Text>
            <Select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              size="sm"
              bg="rgba(6, 6, 15, 0.5)"
              borderColor="whiteAlpha.200"
              _hover={{ borderColor: 'purple.400' }}
              _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
            >
              {messageTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.emoji} {template.name} — {template.description}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="whiteAlpha.500">
              Click a row below to preview and edit the message for that address
            </Text>
          </VStack>
        )}

        {/* Preview Table */}
        {rows.length > 0 && (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Victim Address</Th>
                  <Th>Chain ID</Th>
                  <Th>Theft TX</Th>
                  <Th>Exploiter</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((row, i) => (
                  <Tr 
                    key={i}
                    cursor="pointer"
                    bg={selectedRowIndex === i ? 'rgba(138, 75, 255, 0.1)' : undefined}
                    _hover={{ bg: 'rgba(138, 75, 255, 0.05)' }}
                    onClick={() => setSelectedRowIndex(i)}
                  >
                    <Td>
                      <Code fontSize="xs">{row.address.slice(0, 10)}...</Code>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Text fontSize="xs">{row.chainId}</Text>
                        {isConnected && currentChainId !== row.chainId && (
                          <Text fontSize="xs" color="orange.400" title="Will switch chain">
                            ⚠️
                          </Text>
                        )}
                      </HStack>
                    </Td>
                    <Td>
                      <Code fontSize="xs">{row.theftTxHash.slice(0, 10)}...</Code>
                    </Td>
                    <Td>
                      <Code fontSize="xs">{row.scammer.slice(0, 10)}...</Code>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Text fontSize="xs" color={
                          row.status === 'sent' ? 'green.400' :
                          row.status === 'error' ? 'red.400' :
                          'yellow.400'
                        }>
                          {row.status}
                        </Text>
                        {row.message && (
                          <Text fontSize="xs" color="purple.400" title="Custom message">
                            ✏️
                          </Text>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Message Preview / Editor */}
        {selectedRowIndex !== null && rows[selectedRowIndex] && (
          <Box p={4} bg="rgba(138, 75, 255, 0.06)" borderRadius="lg" border="1px solid" borderColor="rgba(138, 75, 255, 0.2)">
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="700" color="purple.300">
                  💬 Message Preview — Row {selectedRowIndex + 1}
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="purple"
                  onClick={() => setSelectedRowIndex(null)}
                >
                  ✕ Close
                </Button>
              </HStack>
              
              <Textarea
                value={rows[selectedRowIndex].message || generateMessage(rows[selectedRowIndex])}
                onChange={(e) => {
                  const updated = [...rows]
                  updated[selectedRowIndex].message = e.target.value
                  setRows(updated)
                }}
                fontSize="xs"
                fontFamily="monospace"
                minH="200px"
                bg="rgba(6, 6, 15, 0.5)"
                borderColor="whiteAlpha.200"
                _hover={{ borderColor: 'purple.400' }}
                _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
              />
              
              <HStack>
                <Button
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  onClick={() => {
                    const updated = [...rows]
                    updated[selectedRowIndex].message = generateMessage(rows[selectedRowIndex])
                    setRows(updated)
                  }}
                >
                  🔄 Reset to Template
                </Button>
                <Text fontSize="xs" color="whiteAlpha.500">
                  Edit the message above, then sign when ready
                </Text>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Chain Summary */}
        {rows.length > 0 && isConnected && (
          <Box p={3} bg="rgba(255, 159, 10, 0.06)" borderRadius="lg" border="1px solid" borderColor="rgba(255, 159, 10, 0.2)">
            <VStack align="start" spacing={2}>
              <Text fontSize="xs" fontWeight="700" color="orange.300">
                ⛓️ Chain Distribution:
              </Text>
              {Array.from(new Set(rows.map(r => r.chainId))).map(chainId => {
                const count = rows.filter(r => r.chainId === chainId).length
                const isCurrent = chainId === currentChainId
                return (
                  <HStack key={chainId} spacing={2}>
                    <Text fontSize="xs" color={isCurrent ? 'green.400' : 'orange.400'} fontWeight="600">
                      {isCurrent ? '✓' : '⚠️'} Chain {chainId}:
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.500">
                      {count} {count === 1 ? 'row' : 'rows'}
                    </Text>
                    {!isCurrent && (
                      <Text fontSize="xs" color="orange.400" fontStyle="italic">
                        (will prompt to switch)
                      </Text>
                    )}
                  </HStack>
                )
              })}
              {Array.from(new Set(rows.map(r => r.chainId))).length > 1 && (
                <Text fontSize="xs" color="whiteAlpha.400" fontStyle="italic" mt={1}>
                  Multiple chains detected. You'll be prompted to switch between batches.
                </Text>
              )}
            </VStack>
          </Box>
        )}

        {/* Actions */}
        {rows.length > 0 && (
          <VStack align="stretch" spacing={3}>
            <HStack>
              <Button
                colorScheme="purple"
                isLoading={processing}
                onClick={handleSignAll}
                isDisabled={rows.filter(r => r.status === 'pending').length === 0}
              >
                🔏 Sign All ({rows.filter(r => r.status === 'pending').length})
              </Button>
              <Button
                colorScheme="red"
                isLoading={processing}
                onClick={handleSendAll}
                isDisabled={!isConnected || rows.filter(r => r.status === 'signed').length === 0}
              >
                ⚠️ Send All ({rows.filter(r => r.status === 'signed').length})
              </Button>
            </HStack>

            {/* Progress summary */}
            <Box p={3} bg="rgba(6, 6, 15, 0.5)" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text fontSize="xs" color="whiteAlpha.400">Pending:</Text>
                  <Text fontSize="xs" color="yellow.400" fontWeight="600">
                    {rows.filter(r => r.status === 'pending').length}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="xs" color="whiteAlpha.400">Signed:</Text>
                  <Text fontSize="xs" color="purple.400" fontWeight="600">
                    {rows.filter(r => r.status === 'signed').length}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="xs" color="whiteAlpha.400">Sent:</Text>
                  <Text fontSize="xs" color="green.400" fontWeight="600">
                    {rows.filter(r => r.status === 'sent').length}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="xs" color="whiteAlpha.400">Errors:</Text>
                  <Text fontSize="xs" color="red.400" fontWeight="600">
                    {rows.filter(r => r.status === 'error').length}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
