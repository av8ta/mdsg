
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import frontmatterMetadata from './frontmatter.js'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import remarkTOC from 'remark-toc'
import remarkGemoji from 'remark-gemoji'
import remarkDirective from 'remark-directive'
import remarkStringify from 'remark-stringify'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeDocument from 'rehype-document'
import rehypeFormat from 'rehype-format'
import { filter } from 'unist-util-filter'
import { lowlight } from 'lowlight/lib/all.js'

const languages = await importLanguages(lowlight)

const removeFrontmatter = () => tree => filter(tree, node => node.type !== 'yaml')

async function processMarkdown (string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(frontmatterMetadata)
    .use(removeFrontmatter)
    .use(remarkTOC)
    .use(remarkGfm)
    .use(remarkGemoji)
    .use(remarkDirective)
    .use(remarkStringify)
    .process(string)
  return file
}

export async function renderMarkdown (string, { css = [], style = [] } = {}) {
  const markdown = await processMarkdown(string)
  const { metadata } = markdown
  const title = metadata?.title || undefined
  const description = metadata?.description || undefined
  // todo: insert date and author at top of each document
  // const author = metadata?.author || undefined
  // const date = metadata?.date || undefined
  const meta = [
    { name: 'description', content: description },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' }
  ].filter(({ content }) => !!content)

  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight, { ignoreMissing: true, languages })
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
