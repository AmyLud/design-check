import { Finding, FindingCategory, FindingSeverity } from '../shared/findings'

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  'missing-text': 'Missing Text',
  'font-size':    'Font Size',
  'font-weight':  'Font Weight',
  'radius':       'Border Radius',
  'spacing':      'Spacing',
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>(
    (acc, item) => ({ ...acc, [key(item)]: [...(acc[key(item)] ?? []), item] }),
    {}
  )
}

function severityIcon(severity: FindingSeverity): string {
  return severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️'
}

function summaryLine(findings: Finding[]): string {
  const counts = findings.reduce(
    (acc, f) => ({ ...acc, [f.severity]: acc[f.severity as keyof typeof acc] + 1 }),
    { error: 0, warning: 0, info: 0 }
  )
  const parts = [
    counts.error   > 0 ? `**${counts.error} error${counts.error === 1 ? '' : 's'}**`     : null,
    counts.warning > 0 ? `**${counts.warning} warning${counts.warning === 1 ? '' : 's'}**` : null,
    counts.info    > 0 ? `**${counts.info} info**`                                          : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '**0 findings**'
}

function findingsTable(findings: Finding[]): string {
  const rows = findings
    .map((f) => `| ${f.targetName} | ${f.expected} | ${f.actual ?? '—'} |`)
    .join('\n')
  return `| Element | Expected | Actual |\n|---|---|---|\n${rows}`
}

function categorySection(category: FindingCategory, findings: Finding[]): string {
  const label = CATEGORY_LABELS[category]
  const icon  = severityIcon(findings[0].severity)
  return [
    `<details>`,
    `<summary>${icon} ${label} (${findings.length})</summary>`,
    ``,
    findingsTable(findings),
    ``,
    `</details>`,
  ].join('\n')
}

function severitySection(severity: FindingSeverity, findings: Finding[]): string {
  const icon    = severityIcon(severity)
  const label   = severity === 'error' ? 'Errors' : severity === 'warning' ? 'Warnings' : 'Info'
  const byCategory = groupBy(findings, (f) => f.category)

  const sections = Object.entries(byCategory)
    .map(([cat, items]) => categorySection(cat as FindingCategory, items))
    .join('\n\n')

  return [`### ${icon} ${label} (${findings.length})`, '', sections].join('\n')
}

export function formatMarkdownReport(
  findings: Finding[],
  figmaLink: string,
  url: string
): string {
  const header = [
    `## 🎨 Design Check`,
    ``,
    `${summaryLine(findings)} against [\`${url}\`](${url}) · [Figma frame](${figmaLink})`,
  ].join('\n')

  if (findings.length === 0) {
    return [header, '', '✅ No findings — design and implementation match!'].join('\n')
  }

  const bySeverity = groupBy(findings, (f) => f.severity)
  const severityOrder: FindingSeverity[] = ['error', 'warning', 'info']

  const sections = severityOrder
    .filter((s) => bySeverity[s]?.length > 0)
    .map((s) => severitySection(s, bySeverity[s]))
    .join('\n\n')

  return [header, '', sections].join('\n')
}
