#!/usr/bin/env node
import { render } from './index.js'

const args = process.argv.filter(arg => !arg.startsWith('--'))

const folder = args[2] && args[2] !== '.' ? args[2] : process.cwd()
const output = args[3] && args[3] !== '.' ? args[3] : folder
console.warn('input dir:', folder); console.warn('output dir:', output);

await render(folder, output)
