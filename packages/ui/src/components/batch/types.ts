import { type Address } from 'viem'

export interface BatchRow {
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

export const STORAGE_KEY = 'callout-batch-signer-state'
