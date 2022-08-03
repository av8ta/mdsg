#!/usr/bin/env node
import { render } from './index.js'
import Debug from 'debug'
const log = !!process.env.DEBUG ? Debug('mdsg') : console.warn

const args = process.argv.filter(arg => !arg.startsWith('--'))

const folder = args[2] && args[2] !== '.' ? args[2] : process.cwd()
const output = args[3] && args[3] !== '.' ? args[3] : folder

await render(folder, output, { log })
