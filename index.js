import pull from 'pull-stream'
import { read, write } from 'pull-files'
import { renderMarkdown } from './remark.js'
import path from 'node:path'
import rc from 'rc'
import { appendFile } from 'node:fs/promises'

let print

export async function render (inputDir = process.cwd(), outputDir = process.cwd(), { log = console.warn }) {
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

  return new Promise((resolve, reject) => {
    // read markdown and process with remark plugins
    pull(
      read(path.join(inputDir, '**/*.md')),
      pull.asyncMap(async (file, callback) => {
        try {
          const content = await renderMarkdown(file.data, { css, style })
          file.data = content.value
          file.path = file.path.replace('.md', '.html')
        } catch (error) {
          appendFile(path.join(outputDir, 'mdsg.error.log'), `Error rendering markdown of ${path.join(file.base, file.path)}\n`)
        } finally {
          // carry on regardless 🤷
          callback(null, file)
        }
      }),
      write(outputDir, async error => {
        if (error) reject(new Error('Error converting markdown', error))
        else {
          print('Finished writing to', outputDir)
          resolve()
        }
      })
    )
  })
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
  print(`Copying assets from ${assets} to ${outputDir}`)
  return new Promise((resolve, reject) => {
    pull(
      read(path.join(assets, '**/*.*')),
      write(outDir, error => {
        if (error) reject(new Error('Error copying assets', error))
        else resolve('Finished copying assets to', outputDir)
      })
    )
  })
}

function isString (s) {
  return !!(typeof s === 'string' || s instanceof String)
}
