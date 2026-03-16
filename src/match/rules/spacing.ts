import { ContainerMatch } from '../match-containers'
import { Finding } from '../../shared/findings'
import { ThresholdConfig } from '../../shared/config'
import { generateId } from '../../shared/utils'

const SIDES = ['top', 'right', 'bottom', 'left'] as const
type Side = typeof SIDES[number]

function paddingFindings(match: ContainerMatch, delta: number): Finding[] {
  if (!match.designNode.padding) return []
  return SIDES.flatMap((side: Side) => {
    const expected = match.designNode.padding![side]
    const actual = match.renderedNode!.padding?.[side] ?? 0
    const diff = Math.abs(expected - actual)
    if (diff <= delta) return []
    return [{
      id: generateId(),
      severity: 'warning' as const,
      category: 'spacing' as const,
      targetName: match.designNode.name,
      expected: `padding-${side}: ${expected}px`,
      actual: `padding-${side}: ${actual}px`,
      confidence: match.confidence,
      selector: match.renderedNode!.selector,
      message:
        `Padding mismatch on "${match.designNode.name}": ` +
        `padding-${side} expected ${expected}px, got ${actual}px ` +
        `(diff: ${diff}px, threshold: ±${delta}px).`
    }]
  })
}

function marginFindings(match: ContainerMatch, delta: number): Finding[] {
  if (!match.renderedNode!.margin) return []
  return SIDES.flatMap((side: Side) => {
    const actual = match.renderedNode!.margin![side]
    if (actual <= delta) return []
    return [{
      id: generateId(),
      severity: 'warning' as const,
      category: 'spacing' as const,
      targetName: match.designNode.name,
      expected: `margin-${side}: 0px`,
      actual: `margin-${side}: ${actual}px`,
      confidence: match.confidence,
      selector: match.renderedNode!.selector,
      message:
        `Unexpected margin on "${match.designNode.name}": ` +
        `margin-${side} is ${actual}px but the Figma design uses no margins ` +
        `(threshold: ±${delta}px).`
    }]
  })
}

export function checkSpacing(matches: ContainerMatch[], thresholds: ThresholdConfig): Finding[] {
  return matches
    .filter((match) => match.renderedNode !== null)
    .flatMap((match) => [
      ...paddingFindings(match, thresholds.spacingDelta),
      ...marginFindings(match, thresholds.spacingDelta)
    ])
}
