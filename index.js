import pull from 'pull-stream'
import { read, write } from 'pull-files'
import { renderMarkdown } from './remark.js'
import path from 'node:path'
import rc from 'rc'

export async function render(inputDir = process.cwd(), outputDir = process.cwd()) {
  if (inputDir === outputDir) outputDir = path.join(outputDir, 'output')
  console.warn('inputDir ', inputDir); console.warn('outputDir', outputDir)

  const config = rc('mdsg', {})
  console.warn(JSON.stringify(config, null, 2))

  /**
   * if injectCss is false; config.css is rendered as <link rel="stylesheet" href="/..."> in head tag
   * one line for each url in the array. order matters so put your theme css file last
   * 
   * if injectCss is true; the config.assets directory has all css files concatenated
   * together lexicographically sorted by filename and inserted into style tags in head tag
   */
  const css = config.injectCss ? undefined : config.css
  const style = config.injectCss && config.assets ? await concatenateCss(config.assets) : undefined

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
      else console.log('Finished writing to', outputDir)
    })
  )
  // copy assets directory to output directory
  if (config.assets) await outputAssets(config.assets, outputDir)
}

async function concatenateCss(directory) {
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
  const assetsDirname = assets.split(path.sep)
  console.log('assets path', assets)
  console.log('path.basename', path.basename(assets))
  console.log('assetsDirname', assetsDirname)
  pull(
    read(path.join(assets, '**/*.*')),
    pull.through(console.log),
    write(path.join(outputDir, path.basename(assets)), error => {
      if (error) console.error('Error copying assets', error)
      else console.log('Finished copying assets to', outputDir)
    })
  )
}
