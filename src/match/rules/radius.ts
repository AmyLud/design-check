import { MatchResult } from '../match-text'
import { Finding } from '../../shared/findings'
import { ThresholdConfig } from '../../shared/config'
import { generateId } from '../../shared/utils'

function parseBorderRadius(value: string | undefined): number | null {
  if (!value || value === 'none' || value === '') return null
  const num = parseFloat(value.trim().split(/\s+/)[0])
  return isNaN(num) ? null : num
}

export function checkRadius(matches: MatchResult[], thresholds: ThresholdConfig): Finding[] {
  return matches.flatMap((match) => {
    if (!match.renderedNode || match.confidence === 0) return []

    const { designNode, renderedNode } = match
    const { borderRadius: designRadius } = designNode
    if (designRadius == null) return []

    const renderedRadius = parseBorderRadius(renderedNode.borderRadius)

    if (renderedRadius === null) {
      if (designRadius <= thresholds.borderRadiusDelta) return []
      return [{
        id: generateId(),
        severity: 'info' as const,
        category: 'radius' as const,
        targetName: designNode.name,
        expected: designRadius,
        actual: 0,
        confidence: match.confidence,
        message:
          `Border radius mismatch on "${designNode.name}": ` +
          `expected ${designRadius}px, got 0px (no border-radius detected).`
      }]
    }

    const diff = Math.abs(designRadius - renderedRadius)
    if (diff <= thresholds.borderRadiusDelta) return []

    return [{
      id: generateId(),
      severity: 'info' as const,
      category: 'radius' as const,
      targetName: designNode.name,
      expected: designRadius,
      actual: renderedRadius,
      confidence: match.confidence,
      message:
        `Border radius mismatch on "${designNode.name}": ` +
        `expected ${designRadius}px, got ${renderedRadius}px ` +
        `(difference: ${diff.toFixed(1)}px, threshold: ${thresholds.borderRadiusDelta}px).`
    }]
  })
}
