import { DesignNode } from '../figma/normalize'
import { RenderedNode } from '../render/types'

export interface MatchResult {
  designNode: DesignNode
  renderedNode: RenderedNode | null
  confidence: number
}

function sizeSimilarity(design: DesignNode, rendered: RenderedNode): number {
  const avgDiff = (Math.abs(design.width - rendered.width) + Math.abs(design.height - rendered.height)) / 2
  return 1 / (1 + avgDiff / 50)
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

function confidenceFor(designText: string, designLower: string, rendered: RenderedNode): number | null {
  if (!rendered.text) return null
  const text = normalizeText(rendered.text)
  const lower = text.toLowerCase()
  if (text === designText) return 1.0
  if (lower === designLower) return 0.9
  if (lower.includes(designLower) || designLower.includes(lower)) return 0.7
  return null
}

export function matchNodes(designNodes: DesignNode[], renderedNodes: RenderedNode[]): MatchResult[] {
  return designNodes.map((designNode) => {
    const designText = designNode.text ? normalizeText(designNode.text) : ''
    if (!designText) return { designNode, renderedNode: null, confidence: 0 }

    const designLower = designText.toLowerCase()

    const candidates = renderedNodes.flatMap((node) => {
      const confidence = confidenceFor(designText, designLower, node)
      return confidence !== null ? [{ node, confidence }] : []
    })

    if (candidates.length === 0) return { designNode, renderedNode: null, confidence: 0 }

    const maxConfidence = Math.max(...candidates.map((c) => c.confidence))
    const best = candidates
      .filter((c) => c.confidence === maxConfidence)
      .reduce((a, b) => sizeSimilarity(designNode, a.node) >= sizeSimilarity(designNode, b.node) ? a : b)

    return { designNode, renderedNode: best.node, confidence: maxConfidence }
  })
}
