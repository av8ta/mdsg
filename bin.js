#!/usr/bin/env node
import { render } from './index.js'
import Debug from 'debug'
import minimist from 'minimist2'

const log = !!process.env.DEBUG ? Debug('mdsg') : console.warn

const argv = minimist(process.argv.slice(2))
let [input, output] = argv._
input = input || process.cwd()
output = output || input

await render(input, output, { log })
