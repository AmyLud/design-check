import { MatchResult } from '../match-text'
import { Finding } from '../../shared/findings'
import { ThresholdConfig } from '../../shared/config'
import { generateId } from '../../shared/utils'

export function checkFontSize(matches: MatchResult[], thresholds: ThresholdConfig): Finding[] {
  return matches.flatMap((match) => {
    if (!match.renderedNode || match.confidence === 0) return []

    const { designNode, renderedNode } = match
    const { fontSize: designFontSize } = designNode
    const { fontSize: renderedFontSize } = renderedNode

    if (designFontSize == null || renderedFontSize == null) return []

    const diff = Math.abs(designFontSize - renderedFontSize)
    if (diff <= thresholds.fontSizeDelta) return []

    return [{
      id: generateId(),
      severity: 'warning' as const,
      category: 'font-size' as const,
      targetName: designNode.name,
      expected: designFontSize,
      actual: renderedFontSize,
      confidence: match.confidence,
      selector: renderedNode.selector,
      message:
        `Font size mismatch on "${designNode.name}": ` +
        `expected ${designFontSize}px, got ${renderedFontSize}px ` +
        `(difference: ${diff.toFixed(1)}px, threshold: ${thresholds.fontSizeDelta}px).`
    }]
  })
}
