import { Finding, FindingCategory } from '../shared/findings'

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  'missing-text':  'Missing text',
  'font-size':     'Font size',
  'font-weight':   'Font weight',
  'radius':        'Border radius',
  'spacing':       'Spacing (padding / margin)',
  'color':         'Color',
  'contrast':      'Contrast',
  'broken-image':  'Broken images',
}

// CSS property implied by each category, used to generate fix instructions
const CATEGORY_PROPERTY: Partial<Record<FindingCategory, string>> = {
  'font-size':    'font-size',
  'font-weight':  'font-weight',
  'radius':       'border-radius',
  'color':        'color',
}

function selectorLabel(finding: Finding): string {
  return finding.selector ? `\`${finding.selector}\`` : `"${finding.targetName}"`
}

function fixInstruction(finding: Finding): string {
  const target = selectorLabel(finding)

  switch (finding.category) {
    case 'font-size':
      return `${target} — set \`font-size\` to \`${finding.expected}px\` (currently \`${finding.actual}px\`)`

    case 'font-weight':
      return `${target} — set \`font-weight\` to \`${finding.expected}\` (currently \`${finding.actual}\`)`

    case 'radius':
      return `${target} — set \`border-radius\` to \`${finding.expected}px\` (currently \`${finding.actual ?? 0}px\`)`

    case 'color':
      return `${target} — set \`color\` to \`${finding.expected}\` (currently \`${finding.actual}\`)`

    case 'spacing': {
      // expected is like "padding-top: 32px", actual is like "padding-top: 24px"
      const prop = String(finding.expected).split(':')[0].trim()
      const val  = String(finding.expected).split(':')[1]?.trim()
      return `${target} — set \`${prop}\` to \`${val}\` (currently \`${String(finding.actual).split(':')[1]?.trim()}\`)`
    }

    case 'contrast':
      return `${target} — contrast ratio is \`${finding.actual}\`, must be \`${finding.expected}\`. Adjust the text color or background color to meet WCAG AA.`

    case 'broken-image':
      return `${target} — image failed to load (src: \`${finding.actual}\`). Fix the image path or restore the asset.`

    case 'missing-text':
      return `"${finding.targetName}" — text not found on the page. Ensure this content is rendered: \`${finding.expected}\``

    default:
      return finding.message
  }
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  return items.reduce((map, item) => {
    const k = key(item)
    return map.set(k, [...(map.get(k) ?? []), item])
  }, new Map<string, T[]>())
}

export function formatPromptReport(
  findings: Finding[],
  figmaLink: string,
  url: string
): string {
  if (findings.length === 0) {
    return 'No design check findings — the implementation matches the Figma design.'
  }

  const errorCount   = findings.filter(f => f.severity === 'error').length
  const warningCount = findings.filter(f => f.severity === 'warning').length

  const byCategory = groupBy(findings, f => f.category)

  const sections = [...byCategory.entries()].map(([category, items]) => {
    const label = CATEGORY_LABELS[category as FindingCategory] ?? category
    const lines = items.map(f => `- ${fixInstruction(f)}`).join('\n')
    return `### ${label} (${items.length})\n${lines}`
  }).join('\n\n')

  return [
    `The following CSS issues were found by comparing the Figma design to the rendered page at ${url}.`,
    `There are ${errorCount} error${errorCount === 1 ? '' : 's'} and ${warningCount} warning${warningCount === 1 ? '' : 's'}.`,
    `Figma design: ${figmaLink}`,
    ``,
    `Please update the CSS to fix each issue listed below. For each item, the CSS selector`,
    `and the exact property change required are provided.`,
    ``,
    `---`,
    ``,
    sections,
    ``,
    `---`,
    ``,
    `When making changes:`,
    `- Target the selector listed for each issue`,
    `- Only change the specific property mentioned — do not rewrite unrelated styles`,
    `- If a selector appears multiple times, group all its changes into one CSS rule`,
  ].join('\n')
}
