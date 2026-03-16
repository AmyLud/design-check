import { DesignNode, getTextNodes } from '../figma/normalize'
import { RenderedNode } from '../render/types'
import { DesignCheckConfig } from '../shared/config'
import { Finding } from '../shared/findings'
import { matchNodes } from './match-text'
import { matchContainers } from './match-containers'
import { checkTextPresence } from './rules/text-presence'
import { checkFontSize } from './rules/font-size'
import { checkFontWeight } from './rules/font-weight'
import { checkRadius } from './rules/radius'
import { checkSpacing } from './rules/spacing'
import { checkColor } from './rules/color'
import { checkContrast } from './rules/contrast'
import { checkImages } from './rules/images'

/**
 * Run all comparison rules between the Figma design and rendered page nodes.
 * Returns a combined array of findings, sorted by severity (errors first).
 */
export async function compare(
  designRoot: DesignNode,
  renderedNodes: RenderedNode[],
  config: DesignCheckConfig
): Promise<Finding[]> {
  const { thresholds } = config

  // Get all text nodes from the design
  const textNodes = getTextNodes(designRoot)

  // Match design text nodes to rendered nodes
  const matches = matchNodes(textNodes, renderedNodes)

  // Match design container nodes (frames with padding/gap) to rendered nodes
  const containerMatches = matchContainers(designRoot, renderedNodes)

  const presenceFindings     = checkTextPresence(matches)
  const fontSizeFindings     = checkFontSize(matches, thresholds)
  const fontWeightFindings   = checkFontWeight(matches, thresholds)
  const radiusFindings       = checkRadius(matches, thresholds)
  const spacingFindings      = checkSpacing(containerMatches, thresholds)
  const colorFindings        = checkColor(matches, thresholds)
  const contrastFindings     = checkContrast(matches)
  const imageFindings        = checkImages(renderedNodes)

  const allFindings = [
    presenceFindings,
    fontSizeFindings,
    fontWeightFindings,
    radiusFindings,
    spacingFindings,
    colorFindings,
    contrastFindings,
    imageFindings
  ].flat()

  // Sort: errors first, then warnings, then info
  const severityOrder: Record<string, number> = {
    error: 0,
    warning: 1,
    info: 2
  }

  allFindings.sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  )

  return allFindings
}
