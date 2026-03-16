#!/usr/bin/env node

import 'dotenv/config'
import path from 'path'
import { program } from 'commander'
import chalk from 'chalk'
import { parseFigmaLink } from '../figma/parse-link'
import { fetchFigmaNode } from '../figma/client'
import { normalizeFigmaNode } from '../figma/normalize'
import { capturePage } from '../render/capture-page'
import { compare } from '../match/compare'
import { printReport, printCondensedReport } from '../report/console-reporter'
import { formatMarkdownReport } from '../report/markdown-reporter'
import { generateJsonReport } from '../report/json-reporter'
import { loadConfig } from '../shared/config'
import { parseViewport, ensureDir, saveJson } from '../shared/utils'

// ─── CLI definition ────────────────────────────────────────────────────────────

program
  .name('design-check')
  .description('Compare a Figma design frame against a rendered web page')
  .version('1.0.0')
  .requiredOption('--figma <link>', 'Figma frame URL (must include ?node-id=...)')
  .option('--url <local-url>', 'Local page URL to render (e.g. http://localhost:3000/path)')
  .option('--route <path>', 'Route path to render against http://localhost:3000 base')
  .option('--viewport <WxH>', 'Viewport size in WIDTHxHEIGHT format', '1440x1024')
  .option('--config <path>', 'Path to design-check.json config file')
  .option('--output <dir>', 'Directory to save artifacts', './artifacts')
  .option('--verbose', 'Print detailed progress and confidence scores', false)
  .option('--condensed', 'Print one line per finding with no detailed breakdown', false)
  .option('--markdown', 'Output report as GitHub-flavored markdown (for PR comments)', false)
  .option('--json', 'Output report as JSON instead of human-readable text', false)
  .addHelpText(
    'after',
    `
Examples:
  $ design-check --figma "https://www.figma.com/design/abc123/App?node-id=10:20" --url http://localhost:3000/home
  $ design-check --figma "https://www.figma.com/file/abc123/App?node-id=10:20" --route /home --verbose
  $ design-check --figma "..." --url http://localhost:3000 --output ./my-artifacts --json
`
  )

// ─── Helper ────────────────────────────────────────────────────────────────────

function log(message: string, jsonMode: boolean): void {
  if (!jsonMode) {
    console.log(message)
  }
}

function fatal(message: string): never {
  console.error(chalk.red(`\n  Error: ${message}\n`))
  process.exit(1)
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  program.parse(process.argv)
  const opts = program.opts<{
    figma: string
    url?: string
    route?: string
    viewport: string
    config?: string
    output: string
    verbose: boolean
    condensed: boolean
    markdown: boolean
    json: boolean
  }>()

  const isJson = opts.json
  const isVerbose = opts.verbose
  const isCondensed = opts.condensed
  const isMarkdown = opts.markdown

  // ── 1. Validate that either --url or --route is provided ──────────────────────

  if (!opts.url && !opts.route) {
    fatal('You must provide either --url <local-url> or --route <path>.')
  }

  // ── 2. Determine target URL ───────────────────────────────────────────────────

  let targetUrl: string
  if (opts.url) {
    targetUrl = opts.url
  } else {
    const route = opts.route!.startsWith('/') ? opts.route! : `/${opts.route!}`
    targetUrl = `http://localhost:3000${route}`
  }

  // ── 3. Parse viewport ─────────────────────────────────────────────────────────

  let viewport: { width: number; height: number }
  try {
    viewport = parseViewport(opts.viewport)
  } catch (err) {
    fatal((err as Error).message)
  }

  // ── 4. Load config ────────────────────────────────────────────────────────────

  log(chalk.dim('  Loading config...'), isJson)
  let config
  try {
    config = await loadConfig(opts.config)
    // CLI viewport overrides config viewport if explicitly set
    if (opts.viewport !== '1440x1024') {
      config.viewport = viewport
    } else {
      // Use config viewport if not overridden by CLI
      viewport = config.viewport
    }
  } catch (err) {
    fatal((err as Error).message)
  }

  const outputDir = path.resolve(opts.output)
  ensureDir(outputDir)

  // ── 5. Parse Figma link ───────────────────────────────────────────────────────

  log(chalk.blue('\n  Parsing Figma link...'), isJson)
  let fileKey: string
  let nodeId: string
  try {
    const parsed = parseFigmaLink(opts.figma)
    fileKey = parsed.fileKey
    nodeId = parsed.nodeId
    if (isVerbose && !isJson) {
      console.log(chalk.dim(`    File key: ${fileKey}`))
      console.log(chalk.dim(`    Node ID:  ${nodeId}`))
    }
  } catch (err) {
    fatal((err as Error).message)
  }

  // ── 6. Fetch Figma node ───────────────────────────────────────────────────────

  log(chalk.blue('  Fetching Figma frame...'), isJson)
  let rawFigmaNode
  try {
    rawFigmaNode = await fetchFigmaNode(fileKey!, nodeId!)
    if (isVerbose && !isJson) {
      console.log(chalk.dim(`    Frame name: ${rawFigmaNode.name}`))
      console.log(chalk.dim(`    Frame type: ${rawFigmaNode.type}`))
    }
  } catch (err) {
    fatal((err as Error).message)
  }

  // ── 7. Normalize Figma node ───────────────────────────────────────────────────

  log(chalk.blue('  Normalizing Figma data...'), isJson)
  let designRoot
  try {
    designRoot = normalizeFigmaNode(rawFigmaNode!)
  } catch (err) {
    fatal(`Failed to normalize Figma data: ${(err as Error).message}`)
  }

  // Save figma frame artifact
  saveJson(path.join(outputDir, 'figma-frame.json'), rawFigmaNode)

  // ── 8. Render page ────────────────────────────────────────────────────────────

  log(chalk.blue(`  Rendering page: ${targetUrl}`), isJson)
  let captureResult
  try {
    captureResult = await capturePage({
      url: targetUrl,
      viewport: config!.viewport,
      outputDir,
      verbose: isVerbose && !isJson
    })
  } catch (err) {
    fatal(`Failed to render page: ${(err as Error).message}`)
  }

  const { screenshotPath, nodes: renderedNodes } = captureResult!

  // Save rendered DOM artifact
  saveJson(path.join(outputDir, 'rendered-dom.json'), renderedNodes)

  if (isVerbose && !isJson) {
    console.log(chalk.dim(`    Captured ${renderedNodes.length} DOM nodes`))
    console.log(chalk.dim(`    Screenshot: ${screenshotPath}`))
  }

  // ── 9. Compare ────────────────────────────────────────────────────────────────

  log(chalk.blue('  Comparing design to implementation...'), isJson)
  let findings
  try {
    findings = await compare(designRoot!, renderedNodes, config!)
  } catch (err) {
    fatal(`Comparison failed: ${(err as Error).message}`)
  }

  // ── 10. Save findings artifact ────────────────────────────────────────────────

  const jsonReport = generateJsonReport(
    findings!,
    opts.figma,
    targetUrl,
    designRoot!,
    renderedNodes
  )
  saveJson(path.join(outputDir, 'findings.json'), jsonReport)

  // ── 11. Report ────────────────────────────────────────────────────────────────

  if (isJson) {
    console.log(JSON.stringify(jsonReport, null, 2))
  } else if (isMarkdown) {
    console.log(formatMarkdownReport(findings!, opts.figma, targetUrl))
  } else if (isCondensed) {
    printCondensedReport(findings!)
  } else {
    printReport(findings!, opts.figma, targetUrl, outputDir, isVerbose)
  }

  // ── 12. Exit code ─────────────────────────────────────────────────────────────

  const hasErrors = findings!.some((f) => f.severity === 'error')
  process.exit(hasErrors ? 1 : 0)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  fatal(`Unexpected error: ${message}`)
})
