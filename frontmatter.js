import { visit } from 'unist-util-visit'
import { load } from 'js-yaml'

export default function frontmatter() {
  return (tree, file) => {
    visit(tree, 'yaml', node => {
      const yamlData = load(node.value, {
        json: true,
        onWarning() {
          console.log('warning:', arguments)
        }
      })
      file.metadata = yamlData
    })

  }
}
