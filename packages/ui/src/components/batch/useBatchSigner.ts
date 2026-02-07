import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount, useSendTransaction, useChainId, useSwitchChain } from 'wagmi'
import { isAddress, type Address, type Hex, recoverMessageAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { useToast } from '@chakra-ui/react'
import { encodeMessage } from '@callout/shared/encoding'
import { messageTemplates, applyTemplate, getTemplateById, type TemplateCategoryId } from '@callout/shared/templates'
import { type BatchRow, STORAGE_KEY } from './types'

export function useBatchSigner() {
  const { isConnected, address: walletAddress } = useAccount()
  const currentChainId = useChainId()
  const { mutateAsync: switchChain } = useSwitchChain()
  const toast = useToast()
  const { mutateAsync: sendTransaction } = useSendTransaction()

  const loadSavedState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null
      return JSON.parse(saved)
    } catch {
      return null
    }
  }, [])

  const savedState = loadSavedState()
  const [csvText, setCsvText] = useState(savedState?.csvText || '')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    savedState?.selectedTemplateId || 'scam-bounty-simple'
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState<TemplateCategoryId | null>(
    savedState?.selectedCategoryId || null
  )
  const [rows, setRows] = useState<BatchRow[]>(() => {
    if (savedState?.rows && Array.isArray(savedState.rows)) {
      return savedState.rows.map((row: BatchRow) => ({ ...row }))
    }
    return []
  })
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)

  // Derive the desired selected row index from saved state and rows
  const desiredSelectedRowIndex = useMemo(() => {
    if (rows.length === 0) return null

    const currentSavedState = loadSavedState()
    if (currentSavedState?.selectedTxHash) {
      const index = rows.findIndex(row => row.theftTxHash === currentSavedState.selectedTxHash)
      return index >= 0 ? index : null
    }
    return null
  }, [rows])

  // Sync selectedRowIndex with desired index when it changes
  useEffect(() => {
    if (desiredSelectedRowIndex !== selectedRowIndex) {
      setSelectedRowIndex(desiredSelectedRowIndex)
    }
  }, [desiredSelectedRowIndex, selectedRowIndex])

  useEffect(() => {
    try {
      const selectedTxHash = selectedRowIndex !== null && rows[selectedRowIndex]
        ? rows[selectedRowIndex].theftTxHash
        : null

      const stateToSave = {
        csvText,
        selectedTemplateId,
        selectedCategoryId,
        selectedTxHash,
        rows: rows.map(row => ({ ...row })),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch {
      // Ignore localStorage errors
    }
  }, [csvText, selectedTemplateId, selectedCategoryId, rows, selectedRowIndex])

  const getRawTemplate = useCallback((templateId?: string): string => {
    const template = getTemplateById(templateId || selectedTemplateId)
    if (!template) {
      // Return default proof of ownership template
      return `PROOF OF OWNERSHIP\n\nI am the legitimate owner of address \${exploited_address}.\n\nThis address was exploited in transaction:\n\${theft_tx_hash}\n\nThe exploiter who controls my address now:\n\${exploiter_address}\n\nThis message is signed with my private key to prove ownership.\nI am requesting the return of my funds.\n\nSigned on chain ID: \${chain_id}`
    }
    return template.template
  }, [selectedTemplateId])

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
      if (!privateKey.startsWith('0x')) {
        privateKey = `0x${privateKey}`
      }

      try {
        const account = privateKeyToAccount(privateKey as Hex)
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
          templateId: selectedTemplateId,
          message: getRawTemplate(selectedTemplateId), // Initialize with raw template
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
  }, [toast, selectedTemplateId, getRawTemplate])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result as string
      setCsvText(csv)
      parseCSV(csv)
    }
    reader.readAsText(file)
  }, [parseCSV])

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

  // Interpolate a template string with row variables
  const interpolateTemplate = useCallback((templateString: string, row: BatchRow): string => {
    if (!walletAddress) {
      throw new Error('Wallet must be connected to interpolate templates')
    }

    const variables: Record<string, string> = {
      victim_address: row.address,
      exploited_address: row.address,
      exploiter_address: row.scammer,
      spammer_address: row.scammer,
      receive_address: walletAddress,
      theft_tx_hash: row.theftTxHash,
      chain_id: String(row.chainId),
    }

    // Find the template to get variable definitions for proper interpolation
    const template = messageTemplates.find(t => t.id === (row.templateId || selectedTemplateId))
    return applyTemplate(templateString, variables, template)
  }, [selectedTemplateId, walletAddress])

  /**
   * Generate an interpolated message for a row using its template.
   * Uses getRawTemplate to get the template, then interpolates it.
   */
  const generateMessage = useCallback((row: BatchRow, templateId?: string): string => {
    const templateString = getRawTemplate(templateId || row.templateId || selectedTemplateId)
    return interpolateTemplate(templateString, row)
  }, [selectedTemplateId, getRawTemplate, interpolateTemplate])

  /**
   * Get the final interpolated message for a row.
   *
   * After signing, row.message contains the actual signed message (no template variables).
   * This function returns that stored message directly, ensuring we use exactly what was signed.
   *
   * If the message still contains template variables (shouldn't happen after signing),
   * it interpolates them. Otherwise returns the message as-is.
   */
  const getFinalMessage = useCallback((row: BatchRow): string => {
    if (!row.message) return ''

    // After signing, row.message is the actual signed message with no template variables.
    // Check if it's still a template (contains ${variable} syntax)
    if (row.message.includes('${')) {
      return interpolateTemplate(row.message, row)
    }

    // Already interpolated (or was signed), use as-is - this is what was actually signed
    return row.message
  }, [interpolateTemplate])

  /**
   * Get the final calldata message string (message + signature) for a row.
   * This is the string that will be encoded and sent as calldata.
   *
   * After signing, row.message contains the actual signed message (no template variables).
   * We use that directly to ensure we're using exactly what was signed.
   */
  const getCalldataMessage = useCallback((row: BatchRow): string | null => {
    if (!row.signature) return null

    // After signing, row.message contains the actual signed message.
    // If it still has template variables, interpolate it (shouldn't happen after signing, but handle it).
    const finalMessage = getFinalMessage(row)
    if (!finalMessage) return null

    return `MESSAGE: "${finalMessage}"\nSIGNATURE: ${row.signature}`
  }, [getFinalMessage])

  // Derive the new template string
  const newTemplateString = useMemo(() => {
    if (!selectedTemplateId) return null
    return getRawTemplate(selectedTemplateId)
  }, [selectedTemplateId, getRawTemplate])

  // Regenerate templates when template changes (only if row.message doesn't exist or is already a template)
  useEffect(() => {
    if (!newTemplateString) return

    setRows((currentRows) => {
      if (currentRows.length === 0) return currentRows

      const updated = [...currentRows]
      let needsUpdate = false

      for (let i = 0; i < updated.length; i++) {
        const row = updated[i]
        // Only update if message doesn't exist or if it's not a custom template (doesn't contain ${})
        // This preserves user edits that are templates
        if (!row.message || (!row.message.includes('${') && row.message !== newTemplateString)) {
          updated[i].message = newTemplateString
          needsUpdate = true
        }
      }

      return needsUpdate ? updated : currentRows
    })
  }, [newTemplateString]) // Update template when selection changes

  const handleSignAll = useCallback(async () => {
    setProcessing(true)
    const updated = [...rows]

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (row.status !== 'pending') continue

      try {
        row.status = 'signing'
        setRows([...updated])

        // Get the final message to sign (interpolate if needed)
        const messageToSign = row.message
          ? getFinalMessage(row)
          : generateMessage(row, row.templateId)
        const account = privateKeyToAccount(row.privateKey as Hex)
        const signature = await account.signMessage({ message: messageToSign })

        // Store the interpolated message for sending, but keep the template in a separate field
        // For now, we'll store the interpolated version after signing
        row.message = messageToSign
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
  }, [rows, generateMessage, getFinalMessage, toast])

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

    const chainGroups = new Map<number, typeof updated>()
    for (const row of updated) {
      if (row.status !== 'signed') continue
      const group = chainGroups.get(row.chainId) || []
      group.push(row)
      chainGroups.set(row.chainId, group)
    }

    for (const [chainId, chainRows] of chainGroups) {
      if (currentChainId !== chainId) {
        try {
          toast({
            title: 'Switching Network',
            description: `Switching to chain ID ${chainId}...`,
            status: 'info',
            duration: 2000,
          })
          await switchChain({ chainId })
        } catch (err: any) {
          console.error('Chain switch error:', err)
          for (const row of chainRows) {
            row.status = 'error'
            row.error = `Chain switch failed: ${err.message || 'User rejected'}`
          }
          setRows([...updated])
          continue
        }
      }

      for (const row of chainRows) {
        try {
          row.status = 'sending'
          setRows([...updated])

          const calldataMessage = getCalldataMessage(row)
          if (!calldataMessage) {
            throw new Error('No signature available')
          }
          const calldata = encodeMessage(calldataMessage)

          const hash = await sendTransaction({
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
  }, [rows, isConnected, currentChainId, switchChain, sendTransaction, getCalldataMessage, toast])

  const updateRowMessage = useCallback((index: number, message: string) => {
    const updated = [...rows]
    updated[index].message = message
    setRows(updated)
  }, [rows])

  const resetRowMessage = useCallback((index: number) => {
    const updated = [...rows]
    // Reset to raw template, not interpolated
    updated[index].message = getRawTemplate(updated[index].templateId)
    setRows(updated)
  }, [rows, getRawTemplate])

  const clearSignature = useCallback((index: number) => {
    const updated = [...rows]
    updated[index].signature = undefined
    updated[index].status = 'pending'
    setRows(updated)
  }, [rows])

  const clearError = useCallback((index: number) => {
    const updated = [...rows]
    updated[index].status = 'pending'
    updated[index].error = undefined
    // Also clear signature if it exists, since we're resetting the row
    updated[index].signature = undefined
    setRows(updated)
  }, [rows])

  const clearSending = useCallback((index: number) => {
    const updated = [...rows]
    // Reset from "sending" back to "signed" so they can retry
    // Keep the signature since it's still valid
    updated[index].status = 'signed'
    setRows(updated)
  }, [rows])

  /**
   * Recover the address that signed a message from the signature.
   * Returns null if signature or message is missing.
   */
  const recoverAddressFromSignature = useCallback(async (row: BatchRow): Promise<Address | null> => {
    if (!row.signature || !row.message) return null

    try {
      const finalMessage = getFinalMessage(row)
      if (!finalMessage) return null

      const recovered = await recoverMessageAddress({
        message: finalMessage,
        signature: row.signature as Hex,
      })
      return recovered as Address
    } catch {
      return null
    }
  }, [getFinalMessage])

  /**
   * Generate calldata hex for a row (for preview purposes).
   * Returns the hex calldata that would be sent for this row.
   */
  const getCalldataForRow = useCallback((row: BatchRow): Hex | null => {
    if (row.status !== 'signed' || !row.signature) return null

    const calldataMessage = getCalldataMessage(row)
    if (!calldataMessage) return null

    return encodeMessage(calldataMessage)
  }, [getCalldataMessage])

  return {
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
    generateMessage,
    getRawTemplate,
    interpolateTemplate,
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
  }
}
