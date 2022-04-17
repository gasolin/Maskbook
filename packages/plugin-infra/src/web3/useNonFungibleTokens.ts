import type { Web3Plugin } from '../web3-types'
import type { NetworkPluginID } from '../entry-web3'
import { usePluginWeb3StateContext } from './Context'

export function useNonFungibleTokens<T extends Web3Plugin.NonFungibleToken[]>(pluginID?: NetworkPluginID) {
    return usePluginWeb3StateContext(pluginID).nonFungibleTokens as T
}