import pull from 'pull-stream'
import { read, write } from 'pull-files'
import { renderMarkdown } from './remark.js'
import path from 'node:path'
import rc from 'rc'

let print

export async function render(inputDir = process.cwd(), outputDir = process.cwd(), { log = console.warn }) {
  print = log
  if (inputDir === outputDir) outputDir = path.join(outputDir, 'output')
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

  // read markdown and process with remark plugins
  pull(
    read(path.join(inputDir, '**/*.md')),
    pull.asyncMap(async (file, callback) => {
      const content = await renderMarkdown(file.data, { css, style })
      file.data = content.value
      file.path = file.path.replace('.md', '.html')
      callback(null, file)
    }),
    write(outputDir, error => {
      if (error) console.error('Error converting markdown', error)
      else print('Finished writing to', outputDir)
    })
  )
  // copy assets directory to output directory
  if (config.assets) await outputAssets(config.assets, outputDir)
}

async function concatenateCss(directory) {
  print('Concatenating css from', directory)
  return new Promise((resolve, reject) => {
    pull(
      read(path.join(directory, '**/*.css')),
      pull.collect((error, files) => {
        if (error) reject('Error concatenating css', error)
        const sorted = files.sort((a, b) => a.path.localeCompare(b.path))
        const css = sorted.map(file => file.data.toString('utf-8'))
        resolve(css)
      })
    )
  })
}

async function outputAssets(assets, outputDir) {
  pull(
    read(path.join(assets, '**/*.*')),
    write(path.join(outputDir, path.basename(assets)), error => {
      if (error) console.error('Error copying assets', error)
      else print('Finished copying assets to', outputDir)
    })
  )
}

function isString(s) {
  return !!(typeof s === 'string' || s instanceof String)
}
