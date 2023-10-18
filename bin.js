#!/usr/bin/env node
import { render, outputAssets } from './index.js'
import Debug from 'debug'
import minimist from 'minimist2'
import path from 'node:path'

const log = process.env.DEBUG ? Debug('mdsg') : console.warn

const argv = minimist(process.argv.slice(2))

if (argv.help) {
  console.warn(help())
  process.exit(0)
}
if (argv.yaml) {
  console.warn(yamlHelp())
  process.exit(0)
}

let [input, output] = argv._
input = input || process.cwd()
output = output || path.join(input, '_output')

try {
  await render(input, output, { log, pipeout: !process.stdout.isTTY })
} catch (error) {
  console.error('Error rendering markdown:', error)
} finally {
  // copy assets directory to output directory
  await outputAssets(output)
}

process.exit(0)

function help () {
  return `
  Usage
    $ mdsg <inputDir?> <outputDir?> [options]

  Options
    --config      Path to config
    --assets      Path to assets
    --css         JSON array of css to load (passed as string)
    --injectCss   Boolean. Default: false. true injects css from assets into html 
    --help        Displays this message
    --yaml        Displays usage message for frontmatter metadata
`
}

function yamlHelp () {
  return `
  ---
  key: value
  ---

  <authored />

  # Markdown document...

  Frontmatter:

  title?:   Title for html document
  author?:  Document author. Written into <authored /> tag
  date?:    Date published. Also written into <authored /> tag

  meta?:    Properties | Array<Properties> | undefined
    
    Metadata to include in \`head\`.
    
    Each object is passed as
    [\`properties\`](https://github.com/syntax-tree/hastscript#hselector-properties-children)

    to [\`hastscript\`](https://github.com/syntax-tree/hastscript) with a
    \`meta\` element.
`
}
