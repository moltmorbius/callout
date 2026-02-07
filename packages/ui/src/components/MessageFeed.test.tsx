import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { MessageFeed } from './MessageFeed'
import * as explorer from '../services/explorer'

// Mock the explorer service
vi.mock('../services/explorer', () => ({
  fetchAddressTransactions: vi.fn(),
  transactionsToCallouts: vi.fn(),
}))

// Mock viem's isAddress
vi.mock('viem', () => ({
  isAddress: (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr),
}))

// Mock wagmi's useAccount
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined }),
}))

function renderFeed() {
  return render(
    <ChakraProvider>
      <MessageFeed />
    </ChakraProvider>,
  )
}

describe('MessageFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search interface', () => {
    renderFeed()
    expect(screen.getByLabelText('Sender address to search')).toBeInTheDocument()
    expect(screen.getByLabelText('Search for callouts from this address')).toBeInTheDocument()
  })

  it('shows initial empty state before search', () => {
    renderFeed()
    expect(screen.getByText('Search for callouts')).toBeInTheDocument()
    expect(screen.getByText('Enter an address to see the callout messages it has sent.')).toBeInTheDocument()
  })

  it('validates address before searching', async () => {
    renderFeed()
    const input = screen.getByLabelText('Sender address to search')
    const button = screen.getByLabelText('Search for callouts from this address')

    fireEvent.change(input, { target: { value: 'not-an-address' } })
    fireEvent.click(button)

    expect(screen.getByText(/Invalid address/)).toBeInTheDocument()
    expect(explorer.fetchAddressTransactions).not.toHaveBeenCalled()
  })

  it('fetches and displays callouts for a valid address', async () => {
    const mockCallouts = [
      {
        id: '0xabc123',
        sender: '0x1111111111111111111111111111111111111111',
        target: '0x2222222222222222222222222222222222222222',
        message: 'You stole my funds!',
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        chainId: 369,
        txHash: '0xabc123',
        encrypted: false,
      },
    ]

    vi.mocked(explorer.fetchAddressTransactions).mockResolvedValue({
      items: [],
      next_page_params: null,
    })
    vi.mocked(explorer.transactionsToCallouts).mockReturnValue(mockCallouts)

    renderFeed()
    const input = screen.getByLabelText('Sender address to search')
    const button = screen.getByLabelText('Search for callouts from this address')

    fireEvent.change(input, { target: { value: '0x2222222222222222222222222222222222222222' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('You stole my funds!')).toBeInTheDocument()
    })

    expect(screen.getByText('1 found')).toBeInTheDocument()
  })

  it('shows empty state when no callouts found', async () => {
    vi.mocked(explorer.fetchAddressTransactions).mockResolvedValue({
      items: [{ raw_input: '0x12345678' } as unknown as explorer.BlockScoutTransaction],
      next_page_params: null,
    })
    vi.mocked(explorer.transactionsToCallouts).mockReturnValue([])

    renderFeed()
    const input = screen.getByLabelText('Sender address to search')
    const button = screen.getByLabelText('Search for callouts from this address')

    fireEvent.change(input, { target: { value: '0x2222222222222222222222222222222222222222' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('No callouts found')).toBeInTheDocument()
    })
  })

  it('shows error on API failure', async () => {
    vi.mocked(explorer.fetchAddressTransactions).mockRejectedValue(
      new Error('BlockScout API error: 500'),
    )

    renderFeed()
    const input = screen.getByLabelText('Sender address to search')
    const button = screen.getByLabelText('Search for callouts from this address')

    fireEvent.change(input, { target: { value: '0x2222222222222222222222222222222222222222' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch transactions/)).toBeInTheDocument()
    })
  })

  it('supports Enter key to search', () => {
    renderFeed()
    const input = screen.getByLabelText('Sender address to search')

    fireEvent.change(input, { target: { value: '0x2222222222222222222222222222222222222222' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(explorer.fetchAddressTransactions).toHaveBeenCalled()
  })
})
