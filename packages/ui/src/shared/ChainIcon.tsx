import { Image, type ImageProps } from '@chakra-ui/react'
import { CHAIN_INFO } from '../types/callout'

interface ChainIconProps extends Omit<ImageProps, 'src' | 'alt'> {
  chainId: number
  alt?: string
}

/**
 * Reusable component for displaying chain icons using gib.show/image/:chain_id pattern.
 * Falls back to a gray circle SVG if the image fails to load.
 */
export function ChainIcon({ chainId, alt, ...imageProps }: ChainIconProps) {
  const chainInfo = CHAIN_INFO[chainId]
  const chainName = chainInfo?.name ?? `Chain ${chainId}`
  const defaultAlt = alt ?? chainName

  return (
    <Image
      src={`https://gib.show/image/${chainId}`}
      alt={defaultAlt}
      borderRadius="full"
      fallbackSrc={`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="10" fill="#666"/></svg>')}`}
      {...imageProps}
    />
  )
}
