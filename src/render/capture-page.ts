import path from 'path'
import { chromium } from 'playwright'
import { RenderedNode } from './types'
import { extractDomScript } from './extract-dom'
import { ensureDir } from '../shared/utils'

export interface CaptureOptions {
  url: string
  viewport: { width: number; height: number }
  outputDir: string
  verbose?: boolean
}

export interface CaptureResult {
  screenshotPath: string
  nodes: RenderedNode[]
}

export async function capturePage(options: CaptureOptions): Promise<CaptureResult> {
  const { url, viewport, outputDir, verbose } = options

  ensureDir(outputDir)

  if (verbose) {
    console.log(`  Launching Chromium browser...`)
    console.log(`  Navigating to: ${url}`)
    console.log(`  Viewport: ${viewport.width}x${viewport.height}`)
  }

  const browser = await chromium.launch({
    headless: true
  })

  try {
    const context = await browser.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height
      },
      // Disable animations for consistent screenshots
      reducedMotion: 'reduce'
    })

    const page = await context.newPage()

    // Navigate and wait for network to be idle
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      })
    } catch (navError) {
      // If networkidle times out, try with domcontentloaded instead
      if (verbose) {
        console.log(`  Network idle timed out, falling back to domcontentloaded...`)
      }
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })
      // Give JS a moment to run
      await page.waitForTimeout(2000)
    }

    // Take screenshot
    const screenshotPath = path.join(outputDir, 'screenshot.png')
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    })

    if (verbose) {
      console.log(`  Screenshot saved to: ${screenshotPath}`)
    }

    // Extract DOM nodes
    const script = extractDomScript()
    let nodes: RenderedNode[] = []

    try {
      const rawNodes = await page.evaluate(script)
      nodes = (rawNodes as RenderedNode[]) ?? []

      if (verbose) {
        console.log(`  Extracted ${nodes.length} DOM nodes`)
      }
    } catch (evalError) {
      console.warn(`  Warning: DOM extraction failed: ${(evalError as Error).message}`)
      nodes = []
    }

    await context.close()
    return { screenshotPath, nodes }
  } finally {
    await browser.close()
  }
}
