export type FindingSeverity = 'info' | 'warning' | 'error'
export type FindingCategory =
  | 'missing-text'
  | 'font-size'
  | 'font-weight'
  | 'radius'
  | 'spacing'
  | 'color'
  | 'contrast'
  | 'broken-image'

export interface Finding {
  id: string
  severity: FindingSeverity
  category: FindingCategory
  targetName: string
  expected: string | number
  actual: string | number | null
  confidence: number
  message: string
  selector?: string
}
