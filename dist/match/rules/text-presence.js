"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTextPresence = checkTextPresence;
const utils_1 = require("../../shared/utils");
// Matches text composed of multiple pieces joined by a separator,
// e.g. "Jan 2023 - Present", "Section A / Part B", "City | Country"
const COMPOSED_PATTERN = /\S.+\s+[-–—/|·•]\s+.+\S/;
function isComposedText(text) {
    return COMPOSED_PATTERN.test(text);
}
function checkTextPresence(matches) {
    return matches
        .filter((match) => match.confidence === 0 || match.renderedNode === null)
        .filter((match) => !isComposedText(match.designNode.text ?? ''))
        .map((match) => {
        const text = match.designNode.text ?? '';
        const truncated = text.length > 60 ? `${text.slice(0, 60)}…` : text;
        return {
            id: (0, utils_1.generateId)(),
            severity: 'error',
            category: 'missing-text',
            targetName: match.designNode.name,
            expected: truncated || '(empty)',
            actual: null,
            confidence: 0,
            message: `Text node "${match.designNode.name}" with content "${truncated}" was not found on the rendered page.`
        };
    });
}
//# sourceMappingURL=text-presence.js.map