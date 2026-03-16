import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * Parse a viewport string like "1440x1024" into width and height numbers.
 */
export function parseViewport(viewportStr: string): { width: number; height: number } {
  const match = viewportStr.trim().match(/^(\d+)[xX](\d+)$/)
  if (!match) {
    throw new Error(
      `Invalid viewport format: "${viewportStr}"\n` +
      'Expected format: WIDTHxHEIGHT (e.g., 1440x1024 or 375x812)'
    )
  }
  const width = parseInt(match[1], 10)
  const height = parseInt(match[2], 10)

  if (width < 1 || height < 1) {
    throw new Error(`Viewport dimensions must be positive: ${width}x${height}`)
  }

  return { width, height }
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export function ensureDir(dir: string): void {
  const resolved = path.resolve(dir)
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true })
  }
}

/**
 * Save data as pretty-printed JSON to a file.
 */
export function saveJson(filePath: string, data: unknown): void {
  const resolved = path.resolve(filePath)
  ensureDir(path.dirname(resolved))
  fs.writeFileSync(resolved, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Convert RGBA values (r, g, b in 0-255 range, a in 0-1) to a hex color string.
 * If alpha < 1, appends the alpha byte (e.g., #rrggbbaa).
 */
export function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (n: number): string => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')

  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`

  if (a < 1) {
    const alphaHex = toHex(Math.round(a * 255))
    return `${hex}${alphaHex}`
  }

  return hex
}

/**
 * Generate a short unique ID for findings.
 */
export function generateId(): string {
  return crypto.randomBytes(4).toString('hex')
}
