import pull from 'pull-stream'
import { read, write } from 'pull-files'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { renderMarkdown } from './remark.js'

export async function render(inputDir = process.cwd(), outputDir = process.cwd(), cssInline = true) {
  if (inputDir === outputDir) outputDir = join(outputDir, 'output')
  console.warn('inputDir ', inputDir); console.warn('outputDir', outputDir)

  const styles = await tryReadFile(inputDir, 'styles.css')
  const theme = await tryReadFile(inputDir, 'theme.css')

  const css = [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/github-dark.min.css',
    '/css/fonts.css',
    '/css/styles.css',
    '/css/theme.css',
  ]
  const style = [styles, theme]

  pull(
    read(join(inputDir, '**/*.md')),
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
}

async function tryReadFile(directory, file) {
  const filePath = join(directory, file)
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    console.error(`Error reading ${filePath}`)
    return null
  }
}