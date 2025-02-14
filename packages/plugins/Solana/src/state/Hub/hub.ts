import { CoinGecko, MagicEden } from '@masknet/web3-providers'
import {
    CurrencyType,
    FungibleAsset,
    FungibleToken,
    GasOptionType,
    HubOptions,
    isSameAddress,
    NonFungibleAsset,
    NonFungibleToken,
    NonFungibleTokenCollection,
    Pageable,
    SourceType,
    Transaction,
} from '@masknet/web3-shared-base'
import { ChainId, GasOption, getCoinGeckoConstants, getTokenConstants, SchemaType } from '@masknet/web3-shared-solana'
import { SolanaRPC } from '../../messages'
import type { SolanaHub } from './types'

class Hub implements SolanaHub {
    constructor(
        private chainId: ChainId,
        private account: string,
        private sourceType?: SourceType,
        private currencyType?: CurrencyType,
        private sizePerPage = 50,
        private maxPageSize = 25,
    ) {}

    async getFungibleTokensFromTokenList(
        chainId: ChainId,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Array<FungibleToken<ChainId, SchemaType>>> {
        return SolanaRPC.getAllSplTokens()
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
    async getNonFungibleAsset(
        address: string,
        tokenId: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<NonFungibleAsset<ChainId, SchemaType> | undefined> {
        return MagicEden.getAsset(address, tokenId, options)
    }
    async getFungibleAssets(
        account: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<Pageable<FungibleAsset<ChainId, SchemaType>>> {
        return SolanaRPC.getFungibleAssets(account, options)
    }
    getNonFungibleTokens(
        account: string,
        options?: HubOptions<ChainId>,
    ): Promise<Pageable<NonFungibleAsset<ChainId, SchemaType>>> {
        try {
            return MagicEden.getTokens(account, options)
        } catch {
            return SolanaRPC.getNonFungibleAssets(account, options)
        }
    }
    getNonFungibleCollections(
        account: string,
        options?: HubOptions<ChainId>,
    ): Promise<Pageable<NonFungibleTokenCollection<ChainId>>> {
        return MagicEden.getCollections(account, options)
    }
    getFungibleTokenPrice(
        chainId: ChainId,
        address: string,
        options?: HubOptions<ChainId> | undefined,
    ): Promise<number> {
        const expectedChainId = options?.chainId ?? chainId
        const expectedCurrencyType = options?.currencyType ?? this.currencyType
        const { PLATFORM_ID = '', COIN_ID = '' } = getCoinGeckoConstants(expectedChainId)
        const { SOL_ADDRESS } = getTokenConstants(expectedChainId)

        if (isSameAddress(address, SOL_ADDRESS)) {
            return CoinGecko.getTokenPriceByCoinId(COIN_ID, expectedCurrencyType)
        }

        return CoinGecko.getTokenPrice(PLATFORM_ID, address, expectedCurrencyType)
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
        return []
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
    sizePerPage?: number,
    maxPageSize?: number,
) {
    return new Hub(chainId, account, sourceType, currencyType, sizePerPage, maxPageSize)
}
