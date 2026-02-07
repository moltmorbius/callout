import { Box, HStack, Button, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react'
import { useChainId, useSwitchChain } from 'wagmi'
import { networks } from '../../config/web3'
import { useCardStyle } from '../../shared/styles'
import { useThemeTextColor, useThemeBgColor } from '../../shared/useThemeColors'
import { borderRadius, boxShadows, getThemeValue } from '../../config/themeTokens'
import { useColorModeValue } from '@chakra-ui/react'
import { ChainIcon } from '../../shared/ChainIcon'

interface NetworkSelectorProps {
  /** If true, renders without card wrapper for embedding in another card */
  noCard?: boolean
}

/**
 * Network selector component that displays the current network and allows switching.
 */
export function NetworkSelector({ noCard = false }: NetworkSelectorProps = {}) {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const cardStyleContainer = useCardStyle(true)
  const interactiveHoverBg = useThemeBgColor('interactiveHover')
  const cardBg = useThemeBgColor('card')
  const cardBorderShadow = useColorModeValue(
    getThemeValue(boxShadows.borderCard, 'light'),
    getThemeValue(boxShadows.borderCard, 'dark')
  )

  const content = (
    <Menu>
      <MenuButton
        as={Button}
        variant="ghost"
        p={1.5}
        minW="auto"
        w="40px"
        h="40px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={{ bg: interactiveHoverBg }}
      >
        <ChainIcon chainId={chainId} w="24px" h="24px" />
      </MenuButton>
      <MenuList bg={cardBg} border="none" boxShadow={cardBorderShadow}>
        {networks.map((network) => (
          <MenuItem
            key={network.id}
            onClick={() => switchChain?.({ chainId: Number(network.id) })}
            bg={cardBg}
            _hover={{ bg: interactiveHoverBg }}
            fontSize="sm"
            isDisabled={network.id === chainId}
          >
            <HStack spacing={2}>
              <ChainIcon chainId={network.id} w="20px" h="20px" />
              <span>{network.name}</span>
              {network.id === chainId && <span>✓</span>}
            </HStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  )

  if (noCard) {
    return <Box flexShrink={0}>{content}</Box>
  }

  return (
    <Box {...cardStyleContainer}>
      {content}
    </Box>
  )
}
