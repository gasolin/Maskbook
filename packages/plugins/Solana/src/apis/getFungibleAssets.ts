import { memoizePromise } from '@dimensiondev/kit'
import {
    createPageable,
    CurrencyType,
    FungibleAsset,
    FungibleToken,
    HubOptions,
    isSameAddress,
    Pageable,
    TokenType,
} from '@masknet/web3-shared-base'
import { ChainId, getTokenConstants, SchemaType } from '@masknet/web3-shared-solana'
import { createFungibleAsset, createFungibleToken } from '../helpers'
import {
    GetAccountInfoResponse,
    GetProgramAccountsResponse,
    RaydiumTokenList,
    requestRPC,
    SPL_TOKEN_PROGRAM_ID,
} from './shared'

const COINGECKO_URL_BASE = 'https://api.coingecko.com/api/v3'
const requestPath = `${COINGECKO_URL_BASE}/simple/price?ids=solana&vs_currencies=usd`
export async function getSolAsset(chainId: ChainId, account: string) {
    const { SOL_ADDRESS = '' } = getTokenConstants(chainId)
    const priceData = await fetch(requestPath).then(
        (r) => r.json() as Promise<Record<string, Record<CurrencyType, number>>>,
    )
    const price = priceData.solana[CurrencyType.USD]

    const data = await requestRPC<GetAccountInfoResponse>(chainId, {
        method: 'getAccountInfo',
        params: [account],
    })
    const balance = data.result?.value.lamports.toString() ?? '0'
    return createFungibleAsset(
        createFungibleToken(
            chainId,
            SOL_ADDRESS,
            'Solana',
            'SOL',
            9,
            new URL('../assets/solana.png', import.meta.url).toString(),
        ),
        balance,
        {
            [CurrencyType.USD]: price.toString(),
        },
    )
}

const FAKE_SOL_ADDRESS = '11111111111111111111111111111111'
const fetchTokenList = memoizePromise(
    async (url: string): Promise<Array<FungibleToken<ChainId, SchemaType>>> => {
        const response = await fetch(url, { cache: 'force-cache' })
        const tokenList = (await response.json()) as RaydiumTokenList
        const SOL_ADDRESS = getTokenConstants(ChainId.Mainnet).SOL_ADDRESS!
        const tokens: Array<FungibleToken<ChainId, SchemaType>> = [...tokenList.official, ...tokenList.unOfficial].map(
            (token) => {
                const address = token.mint === FAKE_SOL_ADDRESS ? SOL_ADDRESS : token.mint
                return {
                    id: address,
                    chainId: ChainId.Mainnet,
                    type: TokenType.Fungible,
                    schema: SchemaType.Fungible,
                    address,
                    name: token.name,
                    symbol: token.symbol,
                    decimals: token.decimals,
                    logoURL: token.icon,
                }
            },
        )
        return tokens
    },
    (url) => url,
)
const RAYDIUM_TOKEN_LIST = 'https://api.raydium.io/v2/sdk/token/raydium.mainnet.json'
export async function getAllSplTokens() {
    return fetchTokenList(RAYDIUM_TOKEN_LIST)
}

export async function getSplTokenList(chainId: ChainId, account: string) {
    const data = await requestRPC<GetProgramAccountsResponse>(chainId, {
        method: 'getProgramAccounts',
        params: [
            SPL_TOKEN_PROGRAM_ID,
            {
                encoding: 'jsonParsed',
                filters: [
                    {
                        dataSize: 165,
                    },
                    {
                        memcmp: {
                            offset: 32,
                            bytes: account,
                        },
                    },
                ],
            },
        ],
    })
    if (!data.result?.length) return []
    const tokenList = await getAllSplTokens()
    const splTokens: Array<FungibleAsset<ChainId, SchemaType>> = []
    data.result.forEach((x) => {
        const info = x.account.data.parsed.info
        const token = tokenList.find((y) => y.address === info.mint)
        const isSafe = info.tokenAmount.decimals !== 0 && token !== undefined
        if (!isSafe) return
        const name = token.name || 'Unknown Token'
        const symbol = token.symbol || 'Unknown Token'
        const splToken = createFungibleAsset(
            createFungibleToken(chainId, info.mint, name, symbol, info.tokenAmount.decimals, token.logoURL),
            info.tokenAmount.amount,
        )
        splTokens.push(splToken)
    })
    return splTokens
}

export async function getSplTokenBalance(chainId: ChainId, account: string, mintAddress: string) {
    const splTokens = await getSplTokenList(chainId, account)
    const splToken = splTokens.find((x) => isSameAddress(x.address, mintAddress))
    return splToken?.balance ?? '0'
}

export async function getFungibleAssets(
    address: string,
    options?: HubOptions<ChainId>,
): Promise<Pageable<FungibleAsset<ChainId, SchemaType>>> {
    const allSettled = await Promise.allSettled([
        getSolAsset(options?.chainId || ChainId.Mainnet, address).then((x) => [x]),
        getSplTokenList(options?.chainId || ChainId.Mainnet, address),
    ])
    const assets = allSettled
        .map((x) => (x.status === 'fulfilled' ? x.value : null))
        .flat()
        .filter(Boolean)

    return createPageable(assets as Array<FungibleAsset<ChainId, SchemaType>>, 0)
}
