import * as fs from 'fs'
import * as path from 'path'

// demo/synth.stdlib.js is the single source of truth for the Synth standard library.
// Edit that file to add or change stdlib functions; this module reads it at runtime.
const _raw = fs.readFileSync(path.join(__dirname, '..', 'demo', 'synth.stdlib.js'), 'utf8')

// Strip the file-header comment block at the top (lines beginning with //)
export const SYNTH_STDLIB: string = '\n' + _raw.replace(/^(\/\/[^\n]*\n)+/, '')
