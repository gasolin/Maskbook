import BigNumber from 'bignumber.js'
import { first } from 'lodash-unified'
import type { JsonRpcPayload } from 'web3-core-helpers'
import { EthereumMethodType, Transaction } from '../types'

export function addGasMargin(value: BigNumber.Value, scale = 3000) {
    return new BigNumber(value).multipliedBy(new BigNumber(10000).plus(scale)).dividedToIntegerBy(10000)
}

export function createPayload(id: number, method: string, params: any[]) {
    return {
        id,
        jsonrpc: '2.0',
        method,
        params,
    }
}

export function getPayloadId(payload: JsonRpcPayload) {
    return typeof payload.id === 'string' ? Number.parseInt(payload.id, 10) : payload.id
}

export function getPayloadFrom(payload: JsonRpcPayload): string | undefined {
    switch (payload.method) {
        case EthereumMethodType.ETH_SIGN:
            return first(payload.params)
        case EthereumMethodType.PERSONAL_SIGN:
            return payload.params?.[1]
        case EthereumMethodType.ETH_SIGN_TYPED_DATA:
            return first(payload.params)
        default:
            const config = getPayloadConfig(payload)
            return config?.from as string | undefined
    }
}

export function getPayloadChainId(payload: JsonRpcPayload) {
    const config = getPayloadConfig(payload)
    return typeof config?.chainId === 'string' ? Number.parseInt(config.chainId, 16) || undefined : undefined
}

export function getPayloadConfig(payload: JsonRpcPayload) {
    switch (payload.method) {
        case EthereumMethodType.ETH_CALL:
        case EthereumMethodType.ETH_ESTIMATE_GAS:
        case EthereumMethodType.ETH_SIGN_TRANSACTION:
        case EthereumMethodType.ETH_SEND_TRANSACTION: {
            const [config] = payload.params as [Transaction]
            return config
        }
        case EthereumMethodType.MASK_REPLACE_TRANSACTION: {
            const [, config] = payload.params as [string, Transaction]
            return config
        }
        default:
            return
    }
}
