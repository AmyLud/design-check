import { MatchResult } from '../match-text'
import { Finding } from '../../shared/findings'
import { generateId } from '../../shared/utils'

// Matches text composed of multiple pieces joined by a separator,
// e.g. "Jan 2023 - Present", "Section A / Part B", "City | Country"
const COMPOSED_PATTERN = /\S.+\s+[-–—/|·•]\s+.+\S/

function isComposedText(text: string): boolean {
  return COMPOSED_PATTERN.test(text)
}

export function checkTextPresence(matches: MatchResult[]): Finding[] {
  return matches
    .filter((match) => match.confidence === 0 || match.renderedNode === null)
    .filter((match) => !isComposedText(match.designNode.text ?? ''))
    .map((match) => {
      const text = match.designNode.text ?? ''
      const truncated = text.length > 60 ? `${text.slice(0, 60)}…` : text
      return {
        id: generateId(),
        severity: 'error' as const,
        category: 'missing-text' as const,
        targetName: match.designNode.name,
        expected: truncated || '(empty)',
        actual: null,
        confidence: 0,
        message: `Text node "${match.designNode.name}" with content "${truncated}" was not found on the rendered page.`
      }
    })
}
