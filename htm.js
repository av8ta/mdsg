import { visit } from 'unist-util-visit'
import htm from 'htm'
import { h } from 'hastscript'

export const html = htm.bind(h)

/**
 * pass data, selector, and template to replace node selected by selector
 * if you wish to remove the node, return null from template. e.g if required data isn't present
 */
export const rehypeHtm = (options = {}) => {
  const { data = {}, selector = (_node, _index, _parent) => false, template = (node, _index, _parent, _data) => node } = options
  return (tree, _file) => {
    visit(tree, (node, index, parent) => {
      if (selector(node, index, parent)) {
        parent.children[index] = template(node, index, parent, data)
        parent.children = parent.children.filter(node => node !== null)
      }
    })
  }
}
