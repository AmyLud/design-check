import { MatchResult } from '../match-text'
import { Finding } from '../../shared/findings'
import { ThresholdConfig } from '../../shared/config'
import { generateId, parseColor, colorDistance } from '../../shared/utils'

export function checkColor(matches: MatchResult[], thresholds: ThresholdConfig): Finding[] {
  return matches.flatMap((match) => {
    if (!match.renderedNode || match.confidence === 0) return []

    const { designNode, renderedNode } = match
    if (!designNode.color || !renderedNode.color) return []

    const designRgb = parseColor(designNode.color)
    const renderedRgb = parseColor(renderedNode.color)
    if (!designRgb || !renderedRgb) return []

    const dist = colorDistance(designRgb, renderedRgb)
    if (dist <= thresholds.colorDelta) return []

    return [{
      id: generateId(),
      severity: 'warning' as const,
      category: 'color' as const,
      targetName: designNode.name,
      expected: designNode.color,
      actual: renderedNode.color,
      confidence: match.confidence,
      selector: renderedNode.selector,
      message:
        `Color mismatch on "${designNode.name}": ` +
        `expected ${designNode.color}, got ${renderedNode.color} ` +
        `(max channel diff: ${dist}, threshold: ${thresholds.colorDelta}).`
    }]
  })
}
