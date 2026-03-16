import { RenderedNode } from '../../render/types'
import { Finding } from '../../shared/findings'
import { generateId } from '../../shared/utils'

export function checkImages(renderedNodes: RenderedNode[]): Finding[] {
  return renderedNodes
    .filter((node) => node.tag === 'img' && node.imageBroken === true)
    .map((node) => ({
      id: generateId(),
      severity: 'error' as const,
      category: 'broken-image' as const,
      targetName: node.selector,
      expected: 'image loaded',
      actual: node.imageSrc ?? '(no src)',
      confidence: 1,
      selector: node.selector,
      message: `Broken image: <${node.selector}> failed to load${node.imageSrc ? ` (src: ${node.imageSrc})` : ''}.`
    }))
}
