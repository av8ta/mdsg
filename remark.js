/* eslint-disable multiline-ternary */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import frontmatterMetadata from './frontmatter.js'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import remarkTOC from 'remark-toc'
import remarkGemoji from 'remark-gemoji'
import remarkDirective from 'remark-directive'
import readingTime from 'remark-reading-time'
import remarkStringify from 'remark-stringify'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeDocument from 'rehype-document'
import rehypeFormat from 'rehype-format'
import { filter } from 'unist-util-filter'
import { lowlight } from 'lowlight/lib/all.js'
import { rehypeHtm, html } from './htm.js'
import { isElement } from 'hast-util-is-element'

const languages = await importLanguages(lowlight)

const removeFrontmatter = () => tree => filter(tree, node => node.type !== 'yaml')

const makeDate = date => {
  const d = date ? new Date(date) : new Date() // given date or now
  return {
    human: d.toDateString(), machine: d.toISOString()
  }
}
const authored = (_node, _index, _parent, data) => {
  if (!(data.author || data.readingTime?.minutes > 1)) return null
  return html`
    <span class="authored">
      ${data.author ? html`
        <em>${data.author} on </em>
        <time datetime="${makeDate(data.date).machine}">
          ${makeDate(data.date).human}
        </time>` : ''}
      ${data.readingTime.minutes > 1 ? html`<em> ~ ${data.readingTime.text}</em>` : ''}
    </span>`
}
async function processMarkdown (string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(frontmatterMetadata)
    .use(removeFrontmatter)
    .use(remarkTOC)
    .use(readingTime)
    .use(remarkGfm)
    .use(remarkGemoji)
    .use(remarkDirective)
    .use(remarkStringify)
    .process(string)
  return file
}

export async function renderMarkdown (string, { css = [], style = [] } = {}) {
  const markdown = await processMarkdown(string)
  const { metadata, data } = markdown
  const { readingTime } = data
  const title = metadata?.title || undefined
  const description = metadata?.description || undefined
  const author = metadata?.author || undefined
  const date = metadata?.date || undefined
  const meta = [
    { name: 'description', content: description },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' }
  ].filter(({ content }) => !!content)

  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { ignoreMissing: true, languages })
    // replace <authored /> with author and date from yaml frontmatter
    // along with reading time from remark-reading-time plugin
    // removes the <authored /> tag if neither author nor reading time data available
    .use(rehypeHtm, {
      data: { date, author, readingTime },
      template: authored,
      selector: (node, _index, _parent) => isElement(node, 'authored')
    })
    .use(rehypeDocument, { title, meta, css, style })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeFormat)
    .use(rehypeStringify)
    .process(markdown)
  return file
}

async function importLanguages (lowlight) {
  const languages = {}
  const list = lowlight.listLanguages()
  await Promise.all(
    list.map(async language => {
      const pkg = await import(`highlight.js/lib/languages/${language}`)
      languages[language] = pkg.default
    }))
  return languages
}
