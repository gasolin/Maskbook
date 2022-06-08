/// <reference types="@masknet/global-types/compartment" />

import { Compartment, createModuleCache } from '@masknet/compartment'

const { moduleMap, addNamespace } = createModuleCache()
addNamespace('mask:std', {
    x: 'hello world',
})
const compartment = new Compartment({
    resolveHook(importSpec, referrerSpec) {
        return new URL(importSpec, referrerSpec).toString()
    },
    moduleMap,
    async loadHook(fullSpec) {
        if (__mask__compartment__modules__.has(fullSpec)) {
            return { record: __mask__compartment__modules__.get(fullSpec) }
        }
        return undefined
    },
    globals: { console },
})

// @ts-ignore
import(/* webpackIgnore: true */ '/external-plugins/io.mask.example/index.js').then(() => {
    debugger
    compartment.import('mask-plugin://io.mask.example/index.js')
})
