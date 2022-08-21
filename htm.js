import { visit } from 'unist-util-visit'
import htm from 'htm'
import { h } from 'hastscript'
import { select } from 'hast-util-select'
import { isString } from './utils.js'

export const html = htm.bind(h)

/**
 * there's a bug? feature? for using the same plugin twice https://github.com/unifiedjs/unified/issues/79
 * workaround is like so:
 * .use(options => rehypeHtm(options), { options here})
 *
 * pass data, selector, and template to replace node selected by selector
 * if you wish to remove the node, return null from template. e.g if required data isn't present
 */
export function rehypeHtm (options = {}) {
  const { data = {}, append = true, selector = (_node, _index, _parent) => false, template = (node, _index, _parent, _data) => node } = options
  return (tree, _file) => {
    const selected = isString(selector) ? select(selector, tree) : ''
    visit(tree, selected, (node, index, parent) => {
      if (isString(selector) || selector(node, index, parent)) {
        const children = parent.children[index].children || []
        const newNode = template(node, index, parent, data)
        const before = parent.children.slice(0, index)
        const after = parent.children.slice(index + 1)
        const thisNode = append ? [node] : []
        parent.children = [...before, ...thisNode, newNode, ...children, ...after]
        // if the template returns null, filter out the node
        parent.children = parent.children.filter(node => node !== null)
      }
    })
  }
}
