import { MatchResult } from '../match-text'
import { Finding } from '../../shared/findings'
import { ThresholdConfig } from '../../shared/config'
import { generateId } from '../../shared/utils'

export function checkFontWeight(matches: MatchResult[], thresholds: ThresholdConfig): Finding[] {
  return matches.flatMap((match) => {
    if (!match.renderedNode || match.confidence === 0) return []

    const { designNode, renderedNode } = match
    const { fontWeight: designFontWeight } = designNode
    if (designFontWeight == null) return []

    const renderedFontWeight = parseInt(renderedNode.fontWeight ?? '', 10)
    if (isNaN(renderedFontWeight)) return []

    const diff = Math.abs(designFontWeight - renderedFontWeight)
    if (diff <= thresholds.fontWeightTolerance) return []

    return [{
      id: generateId(),
      severity: 'warning' as const,
      category: 'font-weight' as const,
      targetName: designNode.name,
      expected: designFontWeight,
      actual: renderedFontWeight,
      confidence: match.confidence,
      message:
        `Font weight mismatch on "${designNode.name}": ` +
        `expected ${designFontWeight}, got ${renderedFontWeight} ` +
        `(difference: ${diff}, threshold: ${thresholds.fontWeightTolerance}).`
    }]
  })
}
