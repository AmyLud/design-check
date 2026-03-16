import { FigmaNode } from './types'
import { rgbaToHex } from '../shared/utils'

export interface DesignNode {
  id: string
  name: string
  type: 'FRAME' | 'TEXT' | 'RECTANGLE' | 'INSTANCE' | 'GROUP' | 'COMPONENT' | 'OTHER'
  text?: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  color?: string
  borderRadius?: number
  padding?: { top: number; right: number; bottom: number; left: number }
  children: DesignNode[]
}

type KnownNodeType = DesignNode['type']

const KNOWN_TYPES: KnownNodeType[] = [
  'FRAME',
  'TEXT',
  'RECTANGLE',
  'INSTANCE',
  'GROUP',
  'COMPONENT'
]

function normalizeType(rawType: string): KnownNodeType {
  const upper = rawType.toUpperCase() as KnownNodeType
  return KNOWN_TYPES.includes(upper) ? upper : 'OTHER'
}

function extractColor(node: FigmaNode): string | undefined {
  if (!node.fills || node.fills.length === 0) return undefined

  // Find first solid fill with a color
  const solidFill = node.fills.find(
    (fill) => fill.type === 'SOLID' && fill.color != null
  )

  if (!solidFill || !solidFill.color) return undefined

  const { r, g, b, a } = solidFill.color
  // Convert from 0-1 range to 0-255
  return rgbaToHex(
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
    a
  )
}

export function normalizeFigmaNode(node: FigmaNode): DesignNode {
  // Skip invisible nodes by returning a placeholder that gets filtered
  // We still normalize but callers should check visible flag on raw nodes

  const bbox = node.absoluteBoundingBox ?? { x: 0, y: 0, width: 0, height: 0 }
  const style = node.style ?? {}

  const normalizedChildren = (node.children ?? [])
    .filter((child) => child.visible !== false)
    .map(normalizeFigmaNode)

  const designNode: DesignNode = {
    id: node.id,
    name: node.name,
    type: normalizeType(node.type),
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    children: normalizedChildren
  }

  if (node.type === 'TEXT' && node.characters != null) {
    designNode.text = node.characters
  }

  if (style.fontSize != null) {
    designNode.fontSize = style.fontSize
  }

  if (style.fontWeight != null) {
    designNode.fontWeight = style.fontWeight
  }

  if (style.lineHeightPx != null) {
    designNode.lineHeight = style.lineHeightPx
  }

  const color = extractColor(node)
  if (color) {
    designNode.color = color
  }

  if (node.cornerRadius != null) {
    designNode.borderRadius = node.cornerRadius
  }

  if (
    node.paddingTop != null ||
    node.paddingRight != null ||
    node.paddingBottom != null ||
    node.paddingLeft != null
  ) {
    designNode.padding = {
      top: node.paddingTop ?? 0,
      right: node.paddingRight ?? 0,
      bottom: node.paddingBottom ?? 0,
      left: node.paddingLeft ?? 0
    }
  }

  return designNode
}

export function flattenNodes(node: DesignNode): DesignNode[] {
  return [node, ...node.children.flatMap(flattenNodes)]
}

export function getTextNodes(node: DesignNode): DesignNode[] {
  return flattenNodes(node).filter((n) => n.type === 'TEXT')
}
