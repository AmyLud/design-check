import chalk from 'chalk'
import path from 'path'
import { Finding, FindingSeverity } from '../shared/findings'

const SEVERITY_ICONS: Record<FindingSeverity, string> = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ'
}

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  error: 'ERROR',
  warning: 'WARN',
  info: 'INFO'
}

function colorBySeverity(severity: FindingSeverity, text: string): string {
  switch (severity) {
    case 'error':
      return chalk.red(text)
    case 'warning':
      return chalk.yellow(text)
    case 'info':
      return chalk.cyan(text)
  }
}

function formatSeverityBadge(severity: FindingSeverity): string {
  const icon = SEVERITY_ICONS[severity]
  const label = SEVERITY_LABELS[severity]
  return colorBySeverity(severity, `${icon} ${label}`)
}

function groupBySeverity(findings: Finding[]): Record<FindingSeverity, Finding[]> {
  return findings.reduce<Record<FindingSeverity, Finding[]>>(
    (acc, finding) => ({ ...acc, [finding.severity]: [...acc[finding.severity], finding] }),
    { error: [], warning: [], info: [] }
  )
}

export function printCondensedReport(findings: Finding[]): void {
  if (findings.length === 0) {
    console.log(chalk.green('✔ No findings'))
    return
  }

  const errorCount = findings.filter((f) => f.severity === 'error').length
  const warnCount = findings.filter((f) => f.severity === 'warning').length
  const infoCount = findings.filter((f) => f.severity === 'info').length

  const parts: string[] = []
  if (errorCount > 0) parts.push(chalk.red(`${errorCount} error${errorCount === 1 ? '' : 's'}`))
  if (warnCount > 0) parts.push(chalk.yellow(`${warnCount} warning${warnCount === 1 ? '' : 's'}`))
  if (infoCount > 0) parts.push(chalk.cyan(`${infoCount} info`))
  console.log(parts.join(chalk.dim(' · ')))
  console.log()

  for (const finding of findings) {
    const badge = formatSeverityBadge(finding.severity)
    const name = chalk.bold(finding.targetName)
    const detail = `${chalk.green(String(finding.expected))} → ${chalk.red(String(finding.actual ?? '(not found)'))}`
    console.log(`  ${badge}  ${name}  ${chalk.dim(finding.category)}  ${detail}`)
  }

  console.log()
}

export function printReport(
  findings: Finding[],
  figmaLink: string,
  url: string,
  artifactsDir: string,
  verbose?: boolean
): void {
  const divider = chalk.dim('─'.repeat(60))

  console.log()
  console.log(divider)
  console.log(chalk.bold('  Design Check Report'))
  console.log(divider)
  console.log()

  // Summary line
  const totalCount = findings.length
  if (totalCount === 0) {
    console.log(chalk.green.bold('  ✔ No findings — design and implementation match!'))
  } else {
    const errorCount = findings.filter((f) => f.severity === 'error').length
    const warnCount = findings.filter((f) => f.severity === 'warning').length
    const infoCount = findings.filter((f) => f.severity === 'info').length

    const headerColor = errorCount > 0 ? chalk.red.bold : chalk.yellow.bold
    console.log(headerColor(`  Design check: ${totalCount} finding${totalCount === 1 ? '' : 's'}`))

    const parts: string[] = []
    if (errorCount > 0) parts.push(chalk.red(`${errorCount} error${errorCount === 1 ? '' : 's'}`))
    if (warnCount > 0) parts.push(chalk.yellow(`${warnCount} warning${warnCount === 1 ? '' : 's'}`))
    if (infoCount > 0) parts.push(chalk.cyan(`${infoCount} info`))
    console.log(`  ${parts.join(chalk.dim(' · '))}`)
  }

  console.log()

  if (findings.length > 0) {
    const groups = groupBySeverity(findings)
    const severityOrder: FindingSeverity[] = ['error', 'warning', 'info']

    for (const severity of severityOrder) {
      const group = groups[severity]
      if (group.length === 0) continue

      console.log(chalk.bold(`  ${formatSeverityBadge(severity)} findings (${group.length})`))
      console.log()

      for (const finding of group) {
        console.log(`  ${formatSeverityBadge(finding.severity)}  ${chalk.bold(finding.targetName)}`)
        console.log(`    ${chalk.dim('Category:')}  ${finding.category}`)
        console.log(
          `    ${chalk.dim('Expected:')}  ${chalk.green(String(finding.expected))}`
        )
        console.log(
          `    ${chalk.dim('Actual:  ')}  ${finding.actual !== null ? chalk.red(String(finding.actual)) : chalk.red('(not found)')}`
        )
        console.log(`    ${chalk.dim('Message:')}  ${finding.message}`)

        if (verbose) {
          console.log(
            `    ${chalk.dim('Confidence:')} ${(finding.confidence * 100).toFixed(0)}%  ${chalk.dim(`[id: ${finding.id}]`)}`
          )
        }

        console.log()
      }
    }
  }

  console.log(divider)
  console.log(chalk.bold('  Sources'))
  console.log()
  console.log(`  ${chalk.dim('Figma:')}      ${figmaLink}`)
  console.log(`  ${chalk.dim('URL:')}        ${url}`)
  console.log()
  console.log(chalk.bold('  Artifacts'))
  console.log()

  const resolvedDir = path.resolve(artifactsDir)
  console.log(`  ${chalk.dim('Directory:')} ${resolvedDir}`)
  console.log(`  ${chalk.dim('Files:')}`)
  console.log(`    ${chalk.cyan('screenshot.png')}    — rendered page screenshot`)
  console.log(`    ${chalk.cyan('figma-frame.json')} — raw Figma node data`)
  console.log(`    ${chalk.cyan('rendered-dom.json')} — extracted DOM nodes`)
  console.log(`    ${chalk.cyan('findings.json')}    — this report in JSON format`)
  console.log()
  console.log(divider)
  console.log()
}
