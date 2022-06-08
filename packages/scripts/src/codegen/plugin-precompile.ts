import { transform } from '@swc/core'
import { src, dest } from 'gulp'
import { join } from 'path'
import { ROOT_PATH, task } from '../utils'
import { Transform, TransformCallback } from 'stream'

const source = join(ROOT_PATH, 'external-plugins', '**', '*.{js,json}')
const output = join(ROOT_PATH, 'dist', 'external-plugins')

export function pluginPrecompile() {
    return src([source]).pipe(new PluginTransform()).pipe(dest(output))
}

task(pluginPrecompile, 'plugin-precompile', 'Precompile external plugins so they can be runned in the compartment')

class PluginTransform extends Transform {
    constructor() {
        super({ objectMode: true, defaultEncoding: 'utf-8' })
    }
    override _transform(file: any, encoding: BufferEncoding, callback: TransformCallback): void {
        const wasm = require.resolve('@masknet/static-module-record-swc')

        if (file.relative.endsWith('.json')) return callback(null, file)
        transform(file.contents.utf8Slice(), {
            jsc: {
                target: 'es2022',
                experimental: {
                    plugins: [
                        [
                            wasm,
                            {
                                template: {
                                    type: 'callback',
                                    callback: '__mask__compartment__define__',
                                    firstArg: 'mask-plugin://' + file.relative.replace(/\\/g, '/'),
                                },
                            },
                        ],
                    ],
                },
            },
        }).then(
            (output) => {
                file.contents = Buffer.from(output.code, 'utf-8')
                callback(null, file)
            },
            (err) => callback(err),
        )
    }
}
