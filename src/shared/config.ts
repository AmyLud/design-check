import fs from 'fs'
import path from 'path'

export interface ThresholdConfig {
  fontSizeDelta: number
  fontWeightTolerance: number
  borderRadiusDelta: number
  spacingDelta: number
}

export interface DesignCheckConfig {
  viewport: { width: number; height: number }
  thresholds: ThresholdConfig
}

export const DEFAULT_CONFIG: DesignCheckConfig = {
  viewport: { width: 1440, height: 1024 },
  thresholds: {
    fontSizeDelta: 2,
    fontWeightTolerance: 100,
    borderRadiusDelta: 2,
    spacingDelta: 4
  }
}

function deepMerge<T>(base: T, override: Partial<T>): T {
  const result = { ...base }
  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key]
    const baseValue = base[key]
    if (
      overrideValue !== null &&
      overrideValue !== undefined &&
      typeof overrideValue === 'object' &&
      !Array.isArray(overrideValue) &&
      typeof baseValue === 'object' &&
      baseValue !== null
    ) {
      result[key] = deepMerge(baseValue as object, overrideValue as object) as T[keyof T]
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue as T[keyof T]
    }
  }
  return result
}

export async function loadConfig(configPath?: string): Promise<DesignCheckConfig> {
  // Determine which config file to load
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(process.cwd(), 'design-check.json')

  // If an explicit path was provided and doesn't exist, throw
  if (configPath && !fs.existsSync(resolvedPath)) {
    throw new Error(`Config file not found: "${resolvedPath}"`)
  }

  // If no explicit path and default doesn't exist, return defaults
  if (!configPath && !fs.existsSync(resolvedPath)) {
    return DEFAULT_CONFIG
  }

  let rawContent: string
  try {
    rawContent = fs.readFileSync(resolvedPath, 'utf-8')
  } catch (err) {
    throw new Error(`Failed to read config file "${resolvedPath}": ${(err as Error).message}`)
  }

  let parsed: Partial<DesignCheckConfig>
  try {
    parsed = JSON.parse(rawContent) as Partial<DesignCheckConfig>
  } catch (err) {
    throw new Error(
      `Failed to parse config file "${resolvedPath}" as JSON: ${(err as Error).message}`
    )
  }

  return deepMerge(DEFAULT_CONFIG, parsed)
}
