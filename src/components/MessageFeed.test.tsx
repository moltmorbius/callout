import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../config/theme'
import { MessageFeed } from './MessageFeed'

// Wrap component with ChakraProvider for all tests
function renderWithChakra(ui: React.ReactElement) {
  return render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>)
}

describe('MessageFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-07-17T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the feed container', () => {
    renderWithChakra(<MessageFeed />)
    expect(screen.getByTestId('message-feed')).toBeInTheDocument()
  })

  it('displays the feed header with "Recent Callouts"', () => {
    renderWithChakra(<MessageFeed />)
    expect(screen.getByText('Recent Callouts')).toBeInTheDocument()
  })

  it('renders the correct number of callout cards', () => {
    renderWithChakra(<MessageFeed />)
    const cards = screen.getAllByTestId('callout-card')
    // mockCallouts has 7 entries
    expect(cards.length).toBe(7)
  })

  it('shows the posted count badge', () => {
    renderWithChakra(<MessageFeed />)
    expect(screen.getByText('7 posted')).toBeInTheDocument()
  })

  it('shows truncated sender addresses', () => {
    renderWithChakra(<MessageFeed />)
    // vitalik.eth address: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
    // truncated: 0xd8dA…6045
    expect(screen.getByText('0xd8dA…6045')).toBeInTheDocument()
  })

  it('shows chain badges for all represented chains', () => {
    renderWithChakra(<MessageFeed />)
    // Two Ethereum callouts → use getAllByText
    expect(screen.getAllByText('Ξ Ethereum').length).toBe(2)
    expect(screen.getByText('💜 PulseChain')).toBeInTheDocument()
    expect(screen.getByText('🔵 Arbitrum')).toBeInTheDocument()
    expect(screen.getByText('🟣 Polygon')).toBeInTheDocument()
    expect(screen.getByText('🔷 Base')).toBeInTheDocument()
    expect(screen.getByText('🟡 BSC')).toBeInTheDocument()
  })

  it('shows encrypted message placeholder for encrypted callouts', () => {
    renderWithChakra(<MessageFeed />)
    expect(
      screen.getByText('Encrypted message — passphrase required to decrypt')
    ).toBeInTheDocument()
  })

  it('shows "View TX →" links for each card', () => {
    renderWithChakra(<MessageFeed />)
    const txLinks = screen.getAllByText('View TX →')
    expect(txLinks.length).toBe(7)
  })

  it('renders target address sections', () => {
    renderWithChakra(<MessageFeed />)
    // Each card has a "🎯 Target" label
    const targets = screen.getAllByText('🎯 Target')
    expect(targets.length).toBe(7)
  })

  it('renders message content for non-encrypted callouts', () => {
    renderWithChakra(<MessageFeed />)
    // Part of the first mock callout message
    expect(
      screen.getByText(/rug pull on the \$SCAM token/)
    ).toBeInTheDocument()
  })

  it('renders the description text', () => {
    renderWithChakra(<MessageFeed />)
    expect(
      screen.getByText(/Browse on-chain callouts posted by the community/)
    ).toBeInTheDocument()
  })

  it('renders "caller" labels for sender identicons', () => {
    renderWithChakra(<MessageFeed />)
    const callerLabels = screen.getAllByText('caller')
    expect(callerLabels.length).toBe(7)
  })

  it('renders cards sorted by newest first', () => {
    renderWithChakra(<MessageFeed />)
    const cards = screen.getAllByTestId('callout-card')
    // First card should be the newest (1h ago) which is the Ethereum rug pull
    // Verify the first card contains the newest message content
    expect(cards[0].textContent).toContain('0xd8dA…6045')
    // Last card should be the oldest (3 days ago) — BSC wash trading
    expect(cards[6].textContent).toContain('🟡 BSC')
  })

  it('renders TX hash previews in card footers', () => {
    renderWithChakra(<MessageFeed />)
    // First callout tx hash starts with 0xabc12345 and ends with 90ab01
    expect(screen.getByText((_, element) =>
      element?.textContent === '0xabc12345…90ab01' && element.tagName === 'P'
    )).toBeInTheDocument()
  })

  it('links target addresses to correct block explorers', () => {
    renderWithChakra(<MessageFeed />)
    // PulseChain target should link to ipfs.scan.pulsechain.com
    const pulseTarget = screen.getByRole('link', { name: '0x9876…5432' })
    expect(pulseTarget).toHaveAttribute(
      'href',
      'https://ipfs.scan.pulsechain.com/address/0x9876543210FeDcBa9876543210fEdCbA98765432'
    )
  })
})
