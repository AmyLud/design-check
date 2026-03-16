import { Finding } from '../shared/findings'
import { DesignNode } from '../figma/normalize'
import { RenderedNode } from '../render/types'

export function generateJsonReport(
  findings: Finding[],
  figmaLink: string,
  url: string,
  designRoot: DesignNode,
  renderedNodes: RenderedNode[]
): object {
  const counts = findings.reduce(
    (acc, f) => ({ ...acc, [f.severity]: acc[f.severity as keyof typeof acc] + 1 }),
    { error: 0, warning: 0, info: 0 }
  )

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      figmaLink,
      url,
      summary: {
        total: findings.length,
        errors: counts.error,
        warnings: counts.warning,
        info: counts.info
      }
    },
    findings,
    design: {
      rootNode: {
        id: designRoot.id,
        name: designRoot.name,
        type: designRoot.type,
        width: designRoot.width,
        height: designRoot.height
      }
    },
    rendered: {
      nodeCount: renderedNodes.length
    }
  }
}
