import { MatchResult } from '../match-text'
import { Finding } from '../../shared/findings'
import { generateId, parseColor, contrastRatio } from '../../shared/utils'

// WCAG AA thresholds
const NORMAL_TEXT_RATIO = 4.5
const LARGE_TEXT_RATIO  = 3.0

// Large text: >= 18px, or >= 14px bold
function isLargeText(fontSize: number | undefined, fontWeight: string | undefined): boolean {
  if (!fontSize) return false
  if (fontSize >= 18) return true
  if (fontSize >= 14 && fontWeight && parseInt(fontWeight, 10) >= 700) return true
  return false
}

export function checkContrast(matches: MatchResult[]): Finding[] {
  return matches.flatMap((match) => {
    if (!match.renderedNode || match.confidence === 0) return []

    const { designNode, renderedNode } = match
    const { color, effectiveBackgroundColor, fontSize, fontWeight } = renderedNode

    if (!color || !effectiveBackgroundColor) return []

    const fg = parseColor(color)
    const bg = parseColor(effectiveBackgroundColor)
    if (!fg || !bg) return []

    const ratio = contrastRatio(fg, bg)
    const large = isLargeText(fontSize, fontWeight)
    const required = large ? LARGE_TEXT_RATIO : NORMAL_TEXT_RATIO

    if (ratio >= required) return []

    return [{
      id: generateId(),
      severity: 'error' as const,
      category: 'contrast' as const,
      targetName: designNode.name,
      expected: `≥ ${required}:1 (WCAG AA${large ? ' large text' : ''})`,
      actual: `${ratio.toFixed(2)}:1`,
      confidence: match.confidence,
      selector: renderedNode.selector,
      message:
        `Contrast failure on "${designNode.name}": ` +
        `ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum of ${required}:1 ` +
        `(${color} on ${effectiveBackgroundColor}).`
    }]
  })
}
