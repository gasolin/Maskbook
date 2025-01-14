import { Alchemy_FLOW } from '@masknet/web3-providers'
import type {
    FungibleToken,
    NonFungibleToken,
    SourceType,
    CurrencyType,
    FungibleAsset,
    HubOptions,
    NonFungibleAsset,
    Pageable,
    GasOptionType,
    Transaction,
} from '@masknet/web3-shared-base'
import { ChainId, GasOption, getTokenConstants, SchemaType } from '@masknet/web3-shared-flow'
import { createFungibleToken } from '../../helpers'
import { FlowRPC } from '../../messages'
import type { FlowHub } from './types'

class Hub implements FlowHub {
    constructor(
        private chainId: ChainId,
        private account: string,
        private sourceType?: SourceType,
        private currencyType?: CurrencyType,
    ) {}

    async getFungibleTokensFromTokenList(
        chainId: ChainId,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Array<FungibleToken<ChainId, SchemaType>>> {
        const expectedChainId = options?.chainId ?? chainId
        const { FLOW_ADDRESS = '', FUSD_ADDRESS = '', TETHER_ADDRESS = '' } = getTokenConstants(expectedChainId)
        return [
            createFungibleToken(
                expectedChainId,
                FLOW_ADDRESS,
                'Flow',
                'FLOW',
                8,
                new URL('../../assets/flow.png', import.meta.url).toString(),
            ),
            createFungibleToken(
                expectedChainId,
                FUSD_ADDRESS,
                'Flow USD',
                'FUSD',
                8,
                new URL('../../assets/FUSD.png', import.meta.url).toString(),
            ),
            createFungibleToken(
                expectedChainId,
                TETHER_ADDRESS,
                'Tether USD',
                'tUSD',
                8,
                new URL('../../assets/tUSD.png', import.meta.url).toString(),
            ),
        ]
    }
    async getNonFungibleTokensFromTokenList(
        chainId: ChainId,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Array<NonFungibleToken<ChainId, SchemaType>>> {
        throw new Error('Method not implemented.')
    }
    getGasOptions(
        chainId: ChainId,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Record<GasOptionType, GasOption>> {
        throw new Error('Method not implemented.')
    }
    getFungibleAsset(
        address: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<FungibleAsset<ChainId, SchemaType>> {
        throw new Error('Method not implemented.')
    }
    async getFungibleAssets(
        account: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Pageable<FungibleAsset<ChainId, SchemaType>>> {
        const expectedChainId = options?.chainId ?? this.chainId
        return FlowRPC.getFungibleAssets(expectedChainId, account)
    }
    async getNonFungibleAsset(
        address: string,
        tokenId: string,
        options?: HubOptions<ChainId> | undefined,
        ownerAddress?: string,
        contractName?: string,
    ): Promise<NonFungibleAsset<ChainId, SchemaType> | undefined> {
        return Alchemy_FLOW.getAsset(address, tokenId, options, ownerAddress, contractName)
    }
    getNonFungibleTokens(
        account: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Pageable<NonFungibleAsset<ChainId, SchemaType>>> {
        return Alchemy_FLOW.getAssets(account, options)
    }
    getFungibleTokenPrice(
        chainId: ChainId,
        address: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<number> {
        // The Flow chain is unlisted in CoinGecko.
        throw new Error('Method not implemented.')
    }
    getNonFungibleTokenPrice(
        chainId: ChainId,
        address: string,
        tokenId: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<never> {
        throw new Error('Method not implemented.')
    }
    async getFungibleTokenIconURLs(
        chainId: ChainId,
        address: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<string[]> {
        throw new Error('Method not implemented.')
    }
    getNonFungibleTokenIconURLs(
        chainId: ChainId,
        address: string,
        tokenId?: string | undefined,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<string[]> {
        throw new Error('Method not implemented.')
    }
    getTransactions(
        chainId: ChainId,
        account: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Array<Transaction<ChainId, SchemaType>>> {
        throw new Error('Method not implemented.')
    }
}

export function createHub(
    chainId = ChainId.Mainnet,
    account = '',
    sourceType?: SourceType,
    currencyType?: CurrencyType,
) {
    return new Hub(chainId, account, sourceType, currencyType)
}
