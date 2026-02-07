import { Image, HStack, type ImageProps } from '@chakra-ui/react'
import { type Address } from 'viem'

interface TokenIconProps extends Omit<ImageProps, 'src' | 'alt'> {
  chainId: number
  tokenAddress: Address | null | undefined
  tokenSymbol?: string
  alt?: string
}

/**
 * Reusable component for displaying token icons using gib.show/image/:chain_id/:token_address pattern.
 * Only renders if tokenAddress is provided. Falls back to a gray circle SVG if the image fails to load.
 */
export function TokenIcon({ chainId, tokenAddress, tokenSymbol, alt, ...imageProps }: TokenIconProps) {
  if (!tokenAddress) {
    return null
  }

  const defaultAlt = alt ?? tokenSymbol ?? 'Token'

  return (
    <Image
      src={`https://gib.show/image/${chainId}/${tokenAddress}`}
      alt={defaultAlt}
      borderRadius="full"
      fallbackSrc={`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="10" fill="#666"/></svg>')}`}
      {...imageProps}
    />
  )
}

/**
 * Component that displays a token icon alongside token symbol text.
 * Useful for inline token displays.
 */
interface TokenIconWithSymbolProps {
  chainId: number
  tokenAddress: Address | null | undefined
  tokenSymbol: string
  iconSize?: string
  fontSize?: string
  spacing?: number
}

export function TokenIconWithSymbol({
  chainId,
  tokenAddress,
  tokenSymbol,
  iconSize = "16px",
  fontSize = "xs",
  spacing = 2
}: TokenIconWithSymbolProps) {
  return (
    <HStack spacing={spacing} align="center">
      <TokenIcon
        chainId={chainId}
        tokenAddress={tokenAddress}
        tokenSymbol={tokenSymbol}
        w={iconSize}
        h={iconSize}
      />
      <span style={{ fontSize }}>{tokenSymbol}</span>
    </HStack>
  )
}
