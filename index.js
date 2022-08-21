import pull from 'pull-stream'
import { read, write } from 'pull-files'
import { renderMarkdown } from './remark.js'
import path from 'node:path'
import rc from 'rc'
import { appendFile } from 'node:fs/promises'
import { ensureDir } from 'fs-extra'
import { PackrStream } from 'msgpackr'
import { isString } from './utils.js'

let print
let stdout = false
let encodeStream

export async function render (inputDir = process.cwd(), outputDir = process.cwd(), { log = console.warn, pipeout = false }) {
  stdout = pipeout
  if (stdout) {
    encodeStream = new PackrStream({})
    encodeStream.pipe(process.stdout).on('error', error => {
      console.error(`encodeStream.pipe error: ${error.message}`)
    })
  }
  print = log
  print('inputDir ', inputDir); print('outputDir', outputDir)

  const config = rc('mdsg', {})
  print('config:', JSON.stringify(config, null, 2))
  const injectCss = config.injectCss === 'false' ? false : !!config.injectCss

  /**
   * if injectCss is false; config.css is rendered as <link rel="stylesheet" href="/..."> in head tag
   * one line for each url in the array. order matters so put your theme css file last
   *
   * if injectCss is true; the config.assets directory has all css files concatenated
   * together lexicographically sorted by filename and inserted into style tags in head tag
   */
  const css = injectCss ? undefined : isString(config.css) ? JSON.parse(config.css) : config.css
  const style = injectCss && config.assets ? await concatenateCss(config.assets) : undefined

  const contentStream = pull(
    // read markdown files and process with remark plugins
    read(path.join(inputDir, '**/*.md')),
    pull.asyncMap(async (file, callback) => {
      // skip files or directories that start with an underscore
      if (file.path.startsWith('_')) callback(new Error(`Skipping: ${path.join(file.base, file.path)}`))
      try {
        const content = await renderMarkdown(file.data, { css, style })
        file.data = content.value
        file.path = file.path.replace('.md', '.html')
      } catch (error) {
        appendFile(path.join(outputDir, '.mdsg.error.log'), `Error rendering markdown of ${path.join(file.base, file.path)} : ${error}\n`)
      } finally {
        // carry on regardless 🤷
        callback(null, file)
      }
    })
  )

  return new Promise((resolve, reject) => {
    if (stdout) {
      pull(
        contentStream,
        pull.through(file => pipeFile({ ...file, asset: false })),
        pull.collect(() => { resolve() })
      )
    } else {
      ensureDir(outputDir).then(() => {
        pull(
          contentStream,
          write(outputDir, error => {
            if (error && !error.message.startsWith('Skipping:')) {
              reject(new Error(`Error converting markdown: ${error.message}`))
            } else {
              print('Finished writing to', outputDir)
              resolve()
            }
          })
        )
      })
    }
  })
}

function pipeFile (file) {
  try {
    encodeStream.write(file)
  } catch (error) {
    console.error('Error writing to stdout', error)
  }
}

async function concatenateCss (directory) {
  print('Concatenating css from', directory)
  return new Promise((resolve, reject) => {
    pull(
      read(path.join(directory, '**/*.css')),
      pull.collect((error, files) => {
        if (error) reject(new Error('Error concatenating css', error))
        const sorted = files.sort((a, b) => a.path.localeCompare(b.path))
        const css = sorted.map(file => file.data.toString('utf-8'))
        resolve(css)
      })
    )
  })
}

export async function outputAssets (outputDir) {
  const config = rc('mdsg', {})
  if (config.assets) await copyAssets(config.assets, outputDir)
}

async function copyAssets (assets, outputDir) {
  const outDir = path.join(outputDir, path.basename(assets))
  !stdout && print(`Copying assets from ${assets} to ${outputDir}`)
  stdout && print(`Piping assets from ${assets} to stdout`)
  const assetStream = pull(read(path.join(assets, '**/*.*')))
  return new Promise((resolve, reject) => {
    if (stdout) {
      pull(
        assetStream,
        pull.through(file => pipeFile({ ...file, asset: true })),
        pull.collect(() => resolve())
      )
    } else {
      ensureDir(outputDir).then(() => {
        pull(
          assetStream,
          write(outDir, error => {
            if (error) reject(new Error('Error copying assets', error))
            else resolve('Finished copying assets to', outputDir)
          })
        )
      })
    }
  })
}
