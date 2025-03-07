import { Node as UnistNode } from 'unist'
import type { MarkdownRoot, MarkdownNode, MarkdownOptions } from '../types'

type Node = UnistNode & {
  tagName?: string
  value?: string
  children?: Node[]
  properties: Record<string, any>
}

/**
 * JSON compiler
 */
export default function (this: any, _options: MarkdownOptions) {
  /**
   * Parses nodes for JSON structure. Attempts to drop
   * unwanted properties.
   */
  function parseAsJSON (node: Node | Node[]) {
    if (Array.isArray(node)) {
      return node.map(parseAsJSON)
    }
    /**
     * Element node creates an isolated children array to
     * allow nested elements
     */
    if (node.type === 'element') {
      if (node.tagName === 'li') {
        // unwrap unwanted paragraphs around `<li>` children
        let hasPreviousParagraph = false
        node.children = node.children.flatMap((child) => {
          if (child.tagName === 'p') {
            if (hasPreviousParagraph) {
              // Insert line break before new paragraph
              child.children.unshift({
                type: 'element',
                tagName: 'br',
                properties: {}
              })
            }

            hasPreviousParagraph = true
            return child.children
          }
          return child
        }) as Node[]
      }

      /**
       * Rename component slots tags name
       */
      if (node.tagName === 'component-slot') {
        node.tagName = 'template'
      }

      return <MarkdownNode> {
        type: 'element',
        tag: node.tagName as string,
        props: node.properties,
        children: parseAsJSON(node.children || [])
      }
    }

    /**
     * Text node
     */
    if (node.type === 'text') {
      return <MarkdownNode> {
        type: 'text',
        value: node.value as string
      }
    }

    node.children = parseAsJSON(node.children || [])

    return node as MarkdownNode
  }

  this.Compiler = function (root: Node): MarkdownRoot {
    /**
     * We do not use `map` operation, since each node can be expanded to multiple top level
     * nodes. Instead, we need a array to fill in as many elements inside a single
     * iteration
     */
    return {
      type: 'root',
      children: parseAsJSON(root.children || [])
    }
  }
}
