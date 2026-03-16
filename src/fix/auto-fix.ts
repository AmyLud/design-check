import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { BetaMessage, BetaToolUseBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import { z } from 'zod'
import chalk from 'chalk'
import { Finding } from '../shared/findings'
import { formatPromptReport } from '../report/prompt-reporter'

// ─── Tool definition ───────────────────────────────────────────────────────────

const updateCssFilesTool = betaZodTool({
  name: 'update_css_files',
  description:
    'Apply CSS property changes to fix design check findings. ' +
    'Each update targets a specific selector and property in a specific file.',
  inputSchema: z.object({
    updates: z.array(
      z.object({
        file: z.string().describe('Relative or absolute path to the CSS file'),
        selector: z.string().describe('CSS selector to update, e.g. ".hero h1"'),
        property: z.string().describe('CSS property name, e.g. "font-size"'),
        oldValue: z.string().describe('Current value being replaced'),
        newValue: z.string().describe('New value to set'),
      })
    ).describe('List of individual property changes to apply'),
  }),
  run: async (input) => {
    // executed in-loop by the tool runner, but we override via finalMessage below
    return JSON.stringify(input.updates)
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readCssFiles(cssGlobs: string[]): Record<string, string> {
  const files: Record<string, string> = {}
  for (const pattern of cssGlobs) {
    const resolved = path.resolve(pattern)
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      files[resolved] = fs.readFileSync(resolved, 'utf-8')
    }
  }
  return files
}

function applyUpdate(
  content: string,
  selector: string,
  property: string,
  oldValue: string,
  newValue: string
): { updated: string; changed: boolean } {
  // Normalize whitespace for matching
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedProp     = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedOld      = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Match: selector { ... property: oldValue; ... } (simplified single-block match)
  const blockPattern = new RegExp(
    `(${escapedSelector}\\s*\\{[^}]*?)(${escapedProp}\\s*:\\s*)${escapedOld}(\\s*;)`,
    'gs'
  )

  let changed = false
  const updated = content.replace(blockPattern, (_match, pre, propPart, semi) => {
    changed = true
    return `${pre}${propPart}${newValue}${semi}`
  })

  return { updated, changed }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface AutoFixOptions {
  cssPaths: string[]
  findings: Finding[]
  figmaLink: string
  url: string
  verbose: boolean
}

export async function autoFix(opts: AutoFixOptions): Promise<void> {
  const { cssPaths, findings, figmaLink, url, verbose } = opts

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is required for --auto-fix. Add it to your .env file.'
    )
  }

  // ── Read CSS files ──────────────────────────────────────────────────────────

  const cssFiles = readCssFiles(cssPaths)
  const fileCount = Object.keys(cssFiles).length

  if (fileCount === 0) {
    throw new Error(
      `No CSS files found at the path(s) provided: ${cssPaths.join(', ')}`
    )
  }

  console.log(chalk.blue(`\n  Auto-fix: loaded ${fileCount} CSS file(s)`))

  // ── Build prompt ────────────────────────────────────────────────────────────

  const prompt = formatPromptReport(findings, figmaLink, url)

  const fileSection = Object.entries(cssFiles)
    .map(([p, content]) => `### ${path.basename(p)}\nPath: ${p}\n\`\`\`css\n${content}\n\`\`\``)
    .join('\n\n')

  const fullPrompt = [
    prompt,
    '',
    '---',
    '',
    'Here are the CSS files to update:',
    '',
    fileSection,
    '',
    'Call the `update_css_files` tool with all the changes needed to fix every finding above.',
    'Only update properties that directly address a finding — do not reorganize or reformat any other CSS.',
  ].join('\n')

  if (verbose) {
    console.log(chalk.dim(`\n  Sending ${findings.length} finding(s) to Claude Opus 4.6...`))
  }

  // ── Call Claude ─────────────────────────────────────────────────────────────

  const client = new Anthropic()

  const runner = client.beta.messages.toolRunner({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    tools: [updateCssFilesTool],
    tool_choice: { type: 'tool', name: 'update_css_files' },
    messages: [{ role: 'user', content: fullPrompt }],
  })

  process.stdout.write(chalk.dim('  Waiting for Claude'))

  const dots = setInterval(() => process.stdout.write(chalk.dim('.')), 800)

  let finalMessage: BetaMessage
  try {
    finalMessage = await runner
  } finally {
    clearInterval(dots)
    process.stdout.write('\n')
  }

  // ── Extract updates from tool call ──────────────────────────────────────────

  const toolUseBlock = finalMessage.content.find(
    (b): b is BetaToolUseBlock => b.type === 'tool_use'
  )

  if (!toolUseBlock) {
    console.log(chalk.yellow('\n  Auto-fix: Claude did not return any updates.'))
    return
  }

  const { updates } = toolUseBlock.input as {
    updates: Array<{
      file: string
      selector: string
      property: string
      oldValue: string
      newValue: string
    }>
  }

  if (!updates || updates.length === 0) {
    console.log(chalk.yellow('\n  Auto-fix: no changes needed.'))
    return
  }

  // ── Apply updates ───────────────────────────────────────────────────────────

  console.log(chalk.blue(`\n  Applying ${updates.length} fix(es)...\n`))

  // Group by file
  const byFile = updates.reduce<
    Record<string, typeof updates>
  >((acc, u) => {
    const key = path.resolve(u.file)
    return { ...acc, [key]: [...(acc[key] ?? []), u] }
  }, {})

  let totalApplied = 0
  let totalSkipped = 0

  for (const [filePath, fileUpdates] of Object.entries(byFile)) {
    const original = cssFiles[filePath] ?? fs.readFileSync(filePath, 'utf-8')
    let content = original
    const applied: typeof updates = []
    const skipped: typeof updates = []

    for (const u of fileUpdates) {
      const { updated, changed } = applyUpdate(
        content,
        u.selector,
        u.property,
        u.oldValue,
        u.newValue
      )
      if (changed) {
        content = updated
        applied.push(u)
      } else {
        skipped.push(u)
      }
    }

    if (applied.length > 0) {
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(chalk.green(`  ✔  ${path.relative(process.cwd(), filePath)}`))
      for (const u of applied) {
        console.log(
          chalk.dim(`       ${u.selector} { ${u.property}: `) +
          chalk.red(u.oldValue) +
          chalk.dim(' → ') +
          chalk.green(u.newValue) +
          chalk.dim(' }')
        )
      }
      totalApplied += applied.length
    }

    if (skipped.length > 0 && verbose) {
      console.log(chalk.yellow(`  ⚠  Skipped ${skipped.length} change(s) in ${path.basename(filePath)} (selector/value not found):`))
      for (const u of skipped) {
        console.log(chalk.dim(`       ${u.selector} { ${u.property}: ${u.oldValue} }`))
      }
      totalSkipped += skipped.length
    }
  }

  console.log(
    chalk.bold(`\n  ${totalApplied} fix(es) applied`) +
    (totalSkipped > 0 ? chalk.yellow(`, ${totalSkipped} skipped`) : '') +
    '\n'
  )
}
