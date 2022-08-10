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
        const children = parent.children[index].children
        if (children.length > 0) console.log('ruhroh children!')
        const newNode = template(node, index, parent, data)
        // <authored /> has children that ought to be siblings
        if (children.length > 0) {
          const before = parent.children.slice(0, index)
          const after = parent.children.slice(index + 1)
          parent.children = [...before, newNode, ...children, ...after]
        } else parent.children[index] = newNode // <authored></authored>
        // if the template returns null, filter out the node
        parent.children = parent.children.filter(node => node !== null)
      }
    })
  }
}
