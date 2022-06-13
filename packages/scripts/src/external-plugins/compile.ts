import { transform } from '@swc/core'
import { src, dest, watch, lastRun, series } from 'gulp'
import { join } from 'path'
import { ROOT_PATH, watchTask } from '../utils'
import { Transform, TransformCallback } from 'stream'

// https://github.com/paulmillr/chokidar/issues/777 ?
const source = join(ROOT_PATH, 'external-plugins', '**', '*.js').replace(/\\/g, '/')
const output = join(ROOT_PATH, 'dist', 'external-plugins').replace(/\\/g, '/')

export function compile() {
    return src([source], { since: lastRun(compile) })
        .pipe(new PluginTransform())
        .pipe(dest(output))
}

export function compileWatch() {
    return watch(source, { ignoreInitial: false }, series(compile))
}

watchTask(
    compile,
    compileWatch,
    'static-module-record-compiler',
    'Compile files into static module record so they can be run in the compartment',
)

class PluginTransform extends Transform {
    constructor() {
        super({ objectMode: true, defaultEncoding: 'utf-8' })
    }
    override _transform(file: any, encoding: BufferEncoding, callback: TransformCallback): void {
        const wasm = require.resolve('@masknet/static-module-record-swc')

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
